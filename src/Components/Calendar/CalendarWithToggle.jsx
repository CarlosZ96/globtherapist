import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
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
  const { currentUser } = useAuth();

  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  };

  const normalizedTherapyType = normalizeText(therapyType);
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

  // Hook para manejar profesionales
  const {
    availablePros,
    selectedPro,
    selectedProId,
    setSelectedPro,
    setSelectedProId,
    filterDates,
  } = usePros();

  const [selectedDay, setSelectedDay] = useState([]);

  const {
    isConfirmed,
    handleConfirmHours,
    handleEditHours,
  } = useConfirmation(
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
    if (collectionName === 'users') {
      setSelectedDay([{ date: day.date, monthOffset }]);
    } else {
      setSelectedDay((prev) => {
        return prev.some((d) => d.date === day.date && d.monthOffset === monthOffset)
          ? prev.filter((d) => !(d.date === day.date && d.monthOffset === monthOffset))
          : [...prev, { date: day.date, monthOffset }];
      });
    }
  };

  const handleProClick = (proId) => {
    setSelectedPro((prev) => (prev === proId ? null : proId));
    onProSelection(proId);
    setSelectedProId(proId);
  };

  const handleCloseModal = () => {
    setSelectedProId(null);
  };

  useEffect(() => {
    console.log('Componente Calendar renderizado');
    console.log('therapyType:', therapyType);
    console.log('therapyType normalizado:', normalizedTherapyType);
    console.log('isConfirmed:', isConfirmed);
    console.log('availablePros:', availablePros);
    console.log('selectedDay:', selectedDay);
  }, [therapyType, isConfirmed, availablePros, selectedDay]);

  if (loading) {
    return <div>Loading...</div>;
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
          <div className="Hours-lunch-btn">
            <button type="button">lunch</button>
          </div>
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
            <button type="button" className="Edit-Hours" onClick={handleEditHours}>
              <h3>Editar</h3>
            </button>
          )}
        </div>
      </div>
      <hr className="date-blue-line" />
      <div
        className="Pros-cont"
        style={{ display: collectionName === 'pros' ? 'none' : 'block' }}
      >
        <div className="Pros-btn-cont">
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={() => {
              console.log('isConfirmed:', isConfirmed);
              console.log('currentUser:', currentUser);
              console.log('therapyType:', therapyType);
              console.log('therapyType normalizado:', normalizedTherapyType);
              filterDates(currentUser, normalizedTherapyType);
            }}
          >
            <h3>Ver pros</h3>
          </button>
        </div>
        <div className="pro-img-def">
          {availablePros.map((pro) => (
            <button
              key={pro.id}
              type="button"
              className={`user-info-comt ${selectedPro === pro.id ? 'active' : 'inactive'}`}
              onClick={() => handleProClick(pro.id)}
            >
              <div className="user-image-comt">
                <img src={User} alt="user" className="pro-img" />
              </div>
              <h3>{pro.name}</h3>
            </button>
          ))}
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
