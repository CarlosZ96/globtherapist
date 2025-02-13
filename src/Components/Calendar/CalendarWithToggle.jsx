import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';
import useMonthData from '../../hooks/useMonthData';
import useDateTime from '../../hooks/useDateTime';
import usePros from '../../hooks/usePros';
import useConfirmation from '../../hooks/useConfirmation';
import ProModal from '../Hdvwindow';
import User from '../../img/user.png';
import '../../stylesheets/month.css';

const Calendar = ({
  collection: collectionName, onDateSelection, therapyType, onProSelection,
}) => {
  const {
    days, loading, monthName, monthOffset, changeMonth,
  } = useMonthData();
  const { citaGlobal } = useAuth();
  const { currentUser } = useAuth();
  const [showPros, setShowPros] = useState(false);
  const [showLunchDialog, setShowLunchDialog] = useState(false);
  const [selectedLunchHour, setSelectedLunchHour] = useState(null);

  const normalizeText = (text) => {
    if (!text) return '';
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
    console.log(`Normalizing text: "${text}" -> "${normalized}"`);
    return normalized;
  };

  useEffect(() => {
    if (citaGlobal) {
      console.log('Cita global actualizada:', citaGlobal);
    }
  }, [citaGlobal]);

  const normalizedTherapyType = normalizeText(therapyType);
  console.log('Therapy type passed to Calendar (normalized):', normalizedTherapyType);

  const {
    startTime,
    endTime,
    selectedTime,
    setStartTime,
    setEndTime,
    setSelectedTime,
    incrementTime,
    decrementTime,
    formatTime,
    formatTimeRange,
  } = useDateTime();

  const {
    availablePros,
    selectedPro,
    selectedProId,
    setSelectedPro,
    setSelectedProId,
    filterDates,
  } = usePros();

  const [selectedDay, setSelectedDay] = useState([]);

  const { isConfirmed, handleConfirmHours, handleEditHours } = useConfirmation(
    collectionName,
    currentUser,
    selectedDay,
    selectedTime,
    startTime,
    endTime,
    therapyType,
    onDateSelection,
    formatTime,
  );

  const handleDayClick = (day) => {
    console.log('Day clicked:', day);
    if (collectionName === 'users') {
      setSelectedDay([{ date: day.date, monthOffset }]);
    } else {
      setSelectedDay((prev) => {
        const exists = prev.some((d) => d.date === day.date && d.monthOffset === monthOffset);
        console.log(`Day ${day.date} exists in selectedDay:`, exists);
        return exists
          ? prev.filter((d) => !(d.date === day.date && d.monthOffset === monthOffset))
          : [...prev, { date: day.date, monthOffset }];
      });
    }
  };

  const handleEditClick = () => {
    console.log('Editing hours...');
    handleEditHours();
    setShowPros(false);
  };

  const handleShowPros = () => {
    console.log('handleShowPros invoked');
    console.log('isConfirmed:', isConfirmed);
    console.log('currentUser:', currentUser);
    console.log('Original therapyType:', therapyType);
    console.log('Normalized therapyType:', normalizedTherapyType);
    filterDates(currentUser, normalizedTherapyType);
    setShowPros(true);
  };

  const handleProClick = (proId) => {
    console.log('Professional button clicked for proId:', proId);
    setSelectedPro((prev) => {
      const newValue = prev === proId ? null : proId;
      console.log('Updated selectedPro:', newValue);
      return newValue;
    });
    onProSelection(proId);
  };

  const handleShowDetails = (proId) => {
    console.log('Show details for proId:', proId);
    setSelectedProId(proId);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setSelectedProId(null);
  };

  const handleLunchClick = () => {
    setShowLunchDialog(true);
  };

  const handleLunchHourSelect = (hour) => {
    setSelectedLunchHour(hour);
  };

  const handleConfirmLunch = async () => {
    if (!selectedLunchHour) {
      alert('Por favor, selecciona una hora para el lunch.');
      return;
    }

    try {
      // Obtener la referencia del documento del profesional logueado
      const proRef = doc(db, 'pros', currentUser.uid);
      const proSnap = await getDoc(proRef);

      if (proSnap.exists()) {
        const proData = proSnap.data();
        const updatedHorarios = { ...proData.horarios };

        // Recorrer todos los meses y días para eliminar la hora seleccionada
        Object.keys(updatedHorarios).forEach((month) => {
          updatedHorarios[month] = updatedHorarios[month].map((day) => {
            // Filtrar la hora seleccionada de los Timeslots
            return {
              ...day,
              Timeslots: day.Timeslots.filter((slot) => slot !== selectedLunchHour),
            };
          });
        });

        // Actualizar el documento en Firestore
        await updateDoc(proRef, { horarios: updatedHorarios });
        console.log('Hora de lunch eliminada de todos los días:', selectedLunchHour);
      }

      // Cerrar el diálogo y limpiar la selección
      setShowLunchDialog(false);
      setSelectedLunchHour(null);
    } catch (error) {
      console.error('Error al eliminar la hora de lunch:', error);
      alert('Hubo un error al eliminar la hora de lunch. Por favor, inténtalo de nuevo.');
    }
  };

  useEffect(() => {
    console.log('Calendar component rendered');
    console.log('therapyType:', therapyType);
    console.log('Normalized therapyType:', normalizedTherapyType);
    console.log('isConfirmed:', isConfirmed);
    console.log('Available pros:', availablePros);
    console.log('Selected day:', selectedDay);
  }, [therapyType, isConfirmed, availablePros, selectedDay]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const timeSlots = [];
  for (let i = startTime; i < endTime; i += 1) {
    timeSlots.push(`${formatTime(i)}-${formatTime(i + 1)}`);
  }

  return (
    <div className="DynamiCanlendar-cont">
      <div className="calendar-month-cont">
        <button
          className="calendar-month-btn"
          type="button"
          onClick={() => changeMonth(-1)}
        >
          ←
        </button>
        <h2 className="calendar-title">{monthName}</h2>
        <button
          className="calendar-month-btn"
          type="button"
          onClick={() => changeMonth(1)}
        >
          →
        </button>
      </div>
      <hr className="date-blue-line" />
      <div className="calendar-week-cont">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={uuidv4()} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>
      <hr className="date-blue-line" />
      <div className="Choose-Day-Cont">
        <div className="Calendar-cont">
          {days.map((day) => (
            <button
              type="button"
              key={uuidv4()}
              className={`calendar-day ${selectedDay.some((d) => d.date === day?.date && d.monthOffset === monthOffset) ? 'active' : 'inactive'}`}
              onClick={() => handleDayClick(day)}
              disabled={!day || isConfirmed}
            >
              {day ? day.date : ''}
            </button>
          ))}
        </div>
        <div className="Choose-Day-btns-cont">
          <h3 className="Choose-Day-txt">
            {collectionName === 'users'
              ? 'Elige el día de tu valoración.'
              : '¿Qué días estarás disponible para trabajar?'}
          </h3>
          <div className="Dispos-cont">
            <div className="Dispo-cont">
              <h3>Dispo</h3>
              <div className="Dispos-btn" />
            </div>
            <div className="Dispo-cont">
              <h3>No Dispo</h3>
              <div className="Dispos-btn" />
            </div>
          </div>
        </div>
      </div>
      <hr className="date-blue-line" />
      <div className="Hours-cont">
        <div className="Hours-selector-cont">
          {collectionName === 'pros' ? (
            <div className="Hours-selector">
              <div className="Time-selector">
                <h3>De:</h3>
                <div className="Time-control">
                  <button type="button" onClick={() => decrementTime(setStartTime, startTime, 8)}>-</button>
                  <button type="button" onClick={() => incrementTime(setStartTime, startTime, endTime - 1)}>+</button>
                  <div>{formatTime(startTime)}</div>
                </div>
              </div>
              <div className="Time-selector">
                <h3>A:</h3>
                <div className="Time-control">
                  <button type="button" onClick={() => decrementTime(setEndTime, endTime, startTime + 1)}>-</button>
                  <button type="button" onClick={() => incrementTime(setEndTime, endTime, 22)}>+</button>
                  <div>{formatTime(endTime)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="Hours-selector">
              <h3>Selecciona horario:</h3>
              <div className="Time-control">
                <button type="button" onClick={() => decrementTime(setSelectedTime, selectedTime, 7)}>-</button>
                <div>{formatTimeRange(selectedTime)}</div>
                <button type="button" onClick={() => incrementTime(setSelectedTime, selectedTime, 22)}>+</button>
              </div>
            </div>
          )}
        </div>
        <div className="Confirm-button">
          <button
            type="button"
            className="See-Hours"
            onClick={handleConfirmHours}
            disabled={isConfirmed}
          >
            <h3>{collectionName === 'pros' ? 'Confirmar mis horarios' : 'Confirmar hora'}</h3>
          </button>
          {isConfirmed && (
            <>
              <button type="button" className="Edit-Hours" onClick={handleEditClick}>
                <h3>Editar</h3>
              </button>
              <button type="button" className="Lunch-btn" onClick={handleLunchClick}>
                <h3>Lunch</h3>
              </button>
            </>
          )}
        </div>
      </div>
      {showLunchDialog && (
        <div className="Lunch-dialog">
          <h3>Selecciona una hora para el lunch:</h3>
          <div className="Time-slots">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`Time-slot ${selectedLunchHour === slot ? 'active' : ''}`} // Clase "active" condicional
                onClick={() => handleLunchHourSelect(slot)} // Selecciona la hora
              >
                {slot}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleConfirmLunch}>
            Confirmar Lunch
          </button>
          <button type="button" onClick={() => setShowLunchDialog(false)}>
            Cancelar
          </button>
        </div>
      )}
      <hr className="date-blue-line" />
      <div
        className="Pros-cont"
        style={{ display: collectionName === 'pros' ? 'none' : 'block' }}
      >
        <div className="Pros-btn-cont">
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleShowPros}
          >
            <h3>Ver pros</h3>
          </button>
        </div>
        <div className="pro-img-def">
          {showPros && (
            <div className="pro-img-def">
              {availablePros.map((pro) => (
                <div key={pro.id} className="pro-item">
                  <button
                    type="button"
                    className={`user-info-comt ${selectedPro === pro.id ? 'active' : 'inactive'}`}
                    onClick={() => handleProClick(pro.id)}
                  >
                    <div className="user-image-comt">
                      <img src={User} alt="user" className="pro-img" />
                    </div>
                    <h3>{pro.name}</h3>
                  </button>
                  <button
                    type="button"
                    className="show-modal-btn"
                    onClick={() => handleShowDetails(pro.id)}
                  >
                    Ver detalles
                  </button>
                </div>
              ))}
              {selectedProId && (
                <ProModal proId={selectedProId} onClose={handleCloseModal} />
              )}
            </div>
          )}
          {selectedProId && (
            <ProModal proId={selectedProId} onClose={handleCloseModal} />
          )}
        </div>
      </div>
    </div>
  );
};

Calendar.propTypes = {
  collection: PropTypes.oneOf(['users', 'pros']).isRequired,
  onDateSelection: PropTypes.func,
  therapyType: PropTypes.string,
  onProSelection: PropTypes.func,
};

Calendar.defaultProps = {
  onDateSelection: () => { },
  therapyType: () => { },
  onProSelection: () => { },
};

export default Calendar;
