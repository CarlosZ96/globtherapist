/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../AuthContext';
import useMonthData from '../../hooks/useMonthData';
import useDateTime from '../../hooks/useDateTime';
import usePros from '../../hooks/usePros';
import useConfirmation from '../../hooks/useConfirmation';
import ProModal from '../Hdvwindow';
import User from '../../img/user.png';
import up from '../../img/up-arrow.png';
import dwn from '../../img/dwn-arrow.png';
import edit from '../../img/editar.png';
import '../../stylesheets/month.css';

const Calendar = ({
  collection: collectionName, onDateSelection, therapyType, onProSelection, onReturn,
}) => {
  const {
    days, loading, monthName, monthOffset, changeMonth,
  } = useMonthData();
  const { citaGlobal } = useAuth();
  const { currentUser } = useAuth();
  const [showPros, setShowPros] = useState(false);
  const [showLunchDialog, setShowLunchDialog] = useState(false);
  const [selectedLunchHour, setSelectedLunchHour] = useState(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [showLunchButton, setShowLunchButton] = useState(true);
  const [showContainers, setShowContainers] = useState(false);
  const [isPro, setIsPro] = useState(false);
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

  useEffect(() => {
    const checkIfPro = async () => {
      if (currentUser && currentUser.uid) {
        const proRef = doc(db, 'pros', currentUser.uid);
        const proSnap = await getDoc(proRef);
        setIsPro(proSnap.exists());
      } else {
        setIsPro(false);
      }
    };

    checkIfPro();
  }, [currentUser]);

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

  useEffect(() => {
    if (isConfirmed) {
      setShowContainers(true);
    }
  }, [isConfirmed]);

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
      Swal.fire({
        icon: 'warning',
        title: 'Selección incompleta',
        text: 'Por favor, selecciona una hora para el lunch.',
      });
      return;
    }

    try {
      const proRef = doc(db, 'pros', currentUser.uid);
      const proSnap = await getDoc(proRef);
      if (proSnap.exists()) {
        const proData = proSnap.data();
        const updatedHorarios = { ...proData.horarios };
        Object.keys(updatedHorarios).forEach((month) => {
          updatedHorarios[month] = updatedHorarios[month].map((day) => {
            return {
              ...day,
              Timeslots: day.Timeslots.filter((slot) => slot !== selectedLunchHour),
            };
          });
        });

        await updateDoc(proRef, {
          horarios: updatedHorarios,
          lunch: selectedLunchHour,
        });

        console.log('Hora de lunch eliminada de todos los días:', selectedLunchHour);
        console.log('Hora de lunch guardada:', selectedLunchHour);

        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `Hora de lunch "${selectedLunchHour}" confirmada y eliminada de los horarios.`,
          confirmButtonText: 'OK',
        }).then(() => {
          setShowLunchButton(false);
          setShowLunchDialog(false);
          setSelectedLunchHour(null);
        });
      }
    } catch (error) {
      console.error('Error al confirmar la hora de lunch:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al confirmar la hora de lunch. Por favor, inténtalo de nuevo.',
      });
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

  const currentSlots = timeSlots.slice(currentSlotIndex, currentSlotIndex + 3);

  const handleNextSlots = () => {
    setCurrentSlotIndex((prev) => Math.min(prev + 3, timeSlots.length - 3));
  };

  const handlePreviousSlots = () => {
    setCurrentSlotIndex((prev) => Math.max(prev - 3, 0));
  };

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
      <div className="calendar-week-cont">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={uuidv4()} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>
      <div className="Choose-Day-Cont">
        <div className="Calendar-cont" style={{ backgroundColor: '#fff' }}>
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
      </div>
      <div className="Hours-cont">

        <div
          className="Hours-selector-cont"
          style={isConfirmed ? { height: '90%' } : {}}
        >
          <p>¿A que hora?</p>
          {collectionName === 'pros' ? (
            <div className="Hours-selector-pro">
              <div className="Time-selector-pro">
                <h3>De:</h3>
                <div className="Time-control-pro">
                  <div className="time-buttons-cont">
                    <button className="time-button" type="button" onClick={() => incrementTime(setStartTime, startTime, endTime - 1)}>
                      <img src={up} alt="" />
                    </button>
                    <button className="time-button" type="button" onClick={() => decrementTime(setStartTime, startTime, 6)}>
                      <img src={dwn} alt="" />
                    </button>
                  </div>
                  <div className="Time-hour-cont">{formatTime(startTime)}</div>
                </div>
              </div>
              <div className="Time-selector-pro">
                <h3>A:</h3>
                <div className="Time-control-pro">
                  <div className="time-buttons-cont">
                    <button className="time-button" type="button" onClick={() => incrementTime(setEndTime, endTime, 22)}>
                      <img src={up} alt="" />
                    </button>
                    <button className="time-button" type="button" onClick={() => decrementTime(setEndTime, endTime, startTime + 1)}>
                      <img src={dwn} alt="" />
                    </button>
                  </div>
                  <div className="Time-hour-cont">{formatTime(endTime)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="Hours-selector"
              style={isConfirmed ? { height: '100%' } : {}}
            >
              <div
                className="Time-control"
                style={isConfirmed ? { height: '90%' } : {}}
              >
                <button type="button" onClick={() => decrementTime(setSelectedTime, selectedTime, 6)}>-</button>
                <div className="Time-hour-txt">
                  <h3>
                    {formatTimeRange(selectedTime)}
                  </h3>
                </div>
                <button type="button" onClick={() => incrementTime(setSelectedTime, selectedTime, 23)}>+</button>
              </div>
            </div>
          )}
        </div>
        <div
          className="Confirm-button"
          style={{ display: isConfirmed ? 'none' : 'flex' }}
        >
          <button
            type="button"
            className={`See-Hours ${isConfirmed ? 'disable' : ''}`}
            onClick={handleConfirmHours}
            disabled={isConfirmed}
          >
            <h3>{collectionName === 'pros' ? 'Confirmar mis horarios' : 'Confirmar hora'}</h3>
          </button>

          {isConfirmed && onReturn && (
            <button
              type="button"
              className="return-btn"
              onClick={onReturn}
            >
              Volver a mis horarios
            </button>
          )}
        </div>
        {isConfirmed && !onReturn && (
          <>
            <button type="button" className="Edit-Hours" onClick={handleEditClick}>
              <img src={edit} className="edit-btn" alt="" />
              Editar
            </button>
            {isPro && (
              <button
                type="button"
                className="Lunch-btn"
                onClick={handleLunchClick}
                style={{ display: showLunchButton ? 'block' : 'none' }}
              >
                <h3>+ Hora de Almuerzo</h3>
              </button>
            )}
          </>
        )}
      </div>
      {showLunchDialog && (
        <div className="Lunch-dialog">
          <h3>Selecciona una hora para el lunch:</h3>
          <div className="Time-slots">
            <button
              type="button"
              className="Time-slots-nav"
              onClick={handlePreviousSlots}
              disabled={currentSlotIndex === 0}
            >
              -
            </button>
            <div className="Time-slots-container">
              {currentSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`Time-slot ${selectedLunchHour === slot ? 'active' : ''}`}
                  onClick={() => handleLunchHourSelect(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="Time-slots-nav"
              onClick={handleNextSlots}
              disabled={currentSlotIndex >= timeSlots.length - 3}
            >
              +
            </button>
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

      {showContainers && collectionName === 'users' && (
        <div className="Pros-cont">
          {/* Sólo renderizamos el botón si aún NO se han mostrado los pros */}
          {!showPros && (
            <div className="Pros-btn-cont">
              <button
                type="button"
                disabled={!isConfirmed}
                onClick={handleShowPros}
              >
                <h3>Ver pros</h3>
              </button>
            </div>
          )}

          <div className="pro-img-def-cont">
            {showPros && (
              <div className="pro-img-def">
                {availablePros.map((pro) => (
                  <div key={pro.id} className="pro-item">
                    <button
                      type="button"
                      className={`user-info-comt ${selectedPro === pro.id ? 'pro-active' : 'pro-inactive'}`}
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
                      +
                    </button>
                  </div>
                ))}
                {availablePros.length === 0 && (
                  <div className="no-pros-message">
                    <h3>No hay pros disponibles para esta fecha</h3>
                  </div>
                )}
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
      )}

    </div>
  );
};

Calendar.propTypes = {
  collection: PropTypes.oneOf(['users', 'pros']).isRequired,
  onDateSelection: PropTypes.func,
  therapyType: PropTypes.string,
  onProSelection: PropTypes.func,
  onReturn: PropTypes.func,
};
Calendar.defaultProps = {
  onDateSelection: () => { },
  therapyType: () => { },
  onProSelection: () => { },
  onReturn: () => { },
};

export default Calendar;
