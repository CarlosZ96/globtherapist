import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import '../stylesheets/MyCalendar.css';

const MyCalendar = () => {
  const { currentUser } = useAuth();
  const [horarios, setHorarios] = useState({});
  const [lunch, setLunch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [workSchedule, setWorkSchedule] = useState({ start: '', end: '' });

  const convertTimeToMinutes = (timeStr) => {
    const [time, modifier] = timeStr.match(/(\d+:\d+)(am|pm)/i).slice(1);
    const [hours, minutes] = time.split(':').map(Number);

    let totalMinutes = hours * 60 + minutes;
    if (modifier.toLowerCase() === 'pm' && hours !== 12) {
      totalMinutes += 12 * 60;
    }
    if (modifier.toLowerCase() === 'am' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    return totalMinutes;
  };
  // Función para calcular el horario de trabajo
  const calculateWorkSchedule = (horariosData) => {
    let earliestStart = null;
    let latestEnd = null;

    // Recorrer todos los meses y días
    Object.values(horariosData).forEach((monthData) => {
      monthData.forEach((dayData) => {
        dayData.Timeslots.forEach((slot) => {
          // Extraer las horas del formato "6:00am-7:00am"
          const [startStr, endStr] = slot.split('-');

          // Convertir a minutos para comparar
          const startMinutes = convertTimeToMinutes(startStr);
          const endMinutes = convertTimeToMinutes(endStr);

          // Encontrar la hora más temprana
          if (earliestStart === null || startMinutes < earliestStart) {
            earliestStart = startMinutes;
          }

          // Encontrar la hora más tardía
          if (latestEnd === null || endMinutes > latestEnd) {
            latestEnd = endMinutes;
          }
        });
      });
    });

    // Función para convertir minutos a formato de hora
    const convertMinutesToTime = (totalMinutes) => {
      let hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const ampm = hours >= 12 ? 'pm' : 'am';

      hours %= 12;
      hours = hours || 12; // Convertir 0 a 12

      return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}${ampm}`;
    };

    // Convertir de vuelta a formato de hora
    if (earliestStart !== null && latestEnd !== null) {
      setWorkSchedule({
        start: convertMinutesToTime(earliestStart),
        end: convertMinutesToTime(latestEnd),
      });
    }
  };

  useEffect(() => {
    const fetchHorarios = async () => {
      try {
        const proDocRef = doc(db, 'pros', currentUser.uid);
        const docSnap = await getDoc(proDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const horariosData = data.horarios || {};
          setHorarios(horariosData);
          setLunch(data.lunch || '');

          // Calcular horario de trabajo
          calculateWorkSchedule(horariosData);

          // Obtener meses con datos y ordenarlos cronológicamente
          const monthsWithData = Object.keys(horariosData).filter(
            (month) => horariosData[month].length > 0,
          );

          const meses = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
          ];

          // Ordenar meses cronológicamente
          monthsWithData.sort((a, b) => meses.indexOf(a) - meses.indexOf(b));

          setAvailableMonths(monthsWithData);

          // Establecer el primer mes disponible como activo
          if (monthsWithData.length > 0) {
            setActiveMonth(monthsWithData[0]);
          }
        }
      } catch (error) {
        console.error('Error obteniendo horarios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [currentUser]);

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  // Obtener días de la semana
  const getWeekDays = () => {
    return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  };

  // Generar calendario para un mes específico
  const generateCalendar = (monthName) => {
    const monthIndex = meses.indexOf(monthName);
    if (monthIndex === -1) return [];

    const year = new Date().getFullYear();
    const date = new Date(year, monthIndex, 1);
    const days = [];

    // Agregar días vacíos para el primer día del mes
    const firstDay = (date.getDay() + 6) % 7; // Ajuste para que lunes=0
    for (let i = 0; i < firstDay; i += 1) {
      days.push(null);
    }

    // Agregar días del mes
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i += 1) {
      days.push(i);
    }

    return days;
  };

  // Verificar si un día tiene horarios definidos
  const hasScheduleForDay = (day, month) => {
    if (!horarios[month]) return false;
    return horarios[month].some((d) => d.date === day);
  };

  // Navegar al mes anterior disponible
  const goToPreviousMonth = () => {
    const currentIndex = availableMonths.indexOf(activeMonth);
    if (currentIndex > 0) {
      setActiveMonth(availableMonths[currentIndex - 1]);
    } else {
      setActiveMonth(availableMonths[availableMonths.length - 1]);
    }
  };

  // Navegar al siguiente mes disponible
  const goToNextMonth = () => {
    const currentIndex = availableMonths.indexOf(activeMonth);
    if (currentIndex < availableMonths.length - 1) {
      setActiveMonth(availableMonths[currentIndex + 1]);
    } else {
      setActiveMonth(availableMonths[0]);
    }
  };

  if (loading) {
    return <div>Cargando calendario...</div>;
  }

  if (availableMonths.length === 0) {
    return (
      <div className="MyCalendar-cont">
        <div className="MyCalendar-header">
          <h1>Mis horarios</h1>
          <button type="button">Editar</button>
        </div>
        <div className="no-horarios-message">
          <p>No tienes horarios programados para ningún mes.</p>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays();
  const calendarDays = activeMonth ? generateCalendar(activeMonth) : [];

  return (
    <div className="MyCalendar-cont">
      <div className="MyCalendar-header">
        <h1>Mis horarios</h1>
        <button type="button">Editar</button>
      </div>

      <div className="calendar-month-cont">
        <button
          className="calendar-month-btn"
          type="button"
          onClick={goToPreviousMonth}
        >
          ←
        </button>
        <h2 className="calendar-title">{activeMonth}</h2>
        <button
          className="calendar-month-btn"
          type="button"
          onClick={goToNextMonth}
        >
          →
        </button>
      </div>

      <hr className="date-blue-line" />

      <div className="calendar-week-cont">
        {weekDays.map((day) => (
          <div key={uuidv4()} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>

      <hr className="date-blue-line" />

      <div className="Calendar-cont">
        {calendarDays.map((day) => (
          <div
            key={day ? `${activeMonth}-${day}` : uuidv4()}
            className={`calendar-day ${day && hasScheduleForDay(day, activeMonth) ? 'active' : 'inactive'}`}
          >
            {day || ''}
          </div>
        ))}
      </div>

      <div className="schedule-info">
        <div>
          <h2>Horario de trabajo:</h2>
          <p>
            {workSchedule.start || 'No encontrado'}
            {' '}
            -
            {' '}
            {workSchedule.end || 'No encontrado'}
          </p>
        </div>
        <div>
          <h2>Lunch:</h2>
          <p>{lunch || 'No encontrado'}</p>
        </div>
      </div>
    </div>
  );
};

export default MyCalendar;
