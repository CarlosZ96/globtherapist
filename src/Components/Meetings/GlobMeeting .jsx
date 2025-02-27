/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import UserView from './UserView';
import ProView from './ProView';
import { useAuth } from '../../AuthContext';

// Función auxiliar para convertir un string de hora con formato "hh:mmam/pm" a 24 horas.
const convertTimeTo24 = (timeStr) => {
  const t = timeStr.trim().toLowerCase();
  const isPM = t.includes('pm');
  const isAM = t.includes('am');
  // Extraemos la parte numérica (ej: "10:00")
  const timePart = t.replace(/[^0-9:]/g, '');
  const [hStr, mStr] = timePart.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (isPM && hours !== 12) {
    hours += 12;
  }
  if (isAM && hours === 12) {
    hours = 0;
  }
  return [hours, minutes];
};

// Mapeo para convertir el nombre del mes en español a número (0 = enero, 11 = diciembre)
const monthMapping = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const GlobMeeting = ({ collection, cita }) => {
  const { currentUser, citaGlobal } = useAuth();

  // Usamos la cita del contexto si existe; de lo contrario, usamos la prop cita
  const meetingCita = (citaGlobal && citaGlobal.uid) ? citaGlobal : cita;

  // Verifica que la cita disponga de los datos mínimos requeridos
  if (!meetingCita || !meetingCita.month || !meetingCita.startTime || !meetingCita.date) {
    return <div>Error: Información de cita incompleta.</div>;
  }

  if (!currentUser) {
    return <div>Cargando usuario...</div>;
  }

  const [userCollection, setUserCollection] = useState(null);
  const [isWithinOneDay, setIsWithinOneDay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserCollection = async () => {
      if (!currentUser || !currentUser.uid) {
        console.error('Usuario no autenticado');
        setLoading(false);
        return;
      }
      try {
        let foundCollection = null;
        if (collection) {
          const docRef = doc(db, collection, currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            foundCollection = collection;
          }
        }
        if (!foundCollection) {
          const usersRef = doc(db, 'users', currentUser.uid);
          const snapUsers = await getDoc(usersRef);
          if (snapUsers.exists()) {
            foundCollection = 'users';
          }
        }
        if (!foundCollection) {
          const prosRef = doc(db, 'pros', currentUser.uid);
          const snapPros = await getDoc(prosRef);
          if (snapPros.exists()) {
            foundCollection = 'pros';
          }
        }
        setUserCollection(foundCollection);
      } catch (error) {
        console.error('Error al verificar la colección del usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUserCollection();
  }, [collection, currentUser]);

  // Obtén la fecha y hora actual en la zona de Bogotá
  const nowBogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));

  // Comprueba si la cita está a 1 día o menos de distancia (y es futura)
  useEffect(() => {
    if (!meetingCita || !meetingCita.startTime || !meetingCita.date || !meetingCita.month) return;
    const currentYear = nowBogota.getFullYear();
    const monthNum = monthMapping[meetingCita.month.toLowerCase()];
    const [apptHours, apptMinutes] = convertTimeTo24(meetingCita.startTime);
    const appointmentDate = new Date(currentYear, monthNum, meetingCita.date, apptHours, apptMinutes);
    const diff = appointmentDate - nowBogota;
    const oneDayMs = 24 * 60 * 60 * 1000;
    setIsWithinOneDay(diff <= oneDayMs && diff > 0);
  }, [meetingCita, nowBogota]);

  if (loading) return <div>Loading...</div>;
  if (!userCollection) {
    return <div>Error: no se encontró la colección para el usuario.</div>;
  }

  // Recalcula la fecha de la cita
  const currentYear = nowBogota.getFullYear();
  const monthNum = monthMapping[meetingCita.month.toLowerCase()];
  const [apptHours, apptMinutes] = convertTimeTo24(meetingCita.startTime);
  const appointmentDate = new Date(currentYear, monthNum, meetingCita.date, apptHours, apptMinutes);
  const diffMs = appointmentDate - nowBogota;

  // Si la cita aún no está dentro de las 24 horas o es futura, mostramos el mensaje de espera
  if (!isWithinOneDay) {
    if (diffMs < 0) {
      // La cita ya pasó
      const absDiffMs = Math.abs(diffMs);
      const diffDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
      return (
        <div>
          La cita ya pasó hace:
          {' '}
          {diffDays}
          {' '}
          día
          {diffDays !== 1 ? 's' : ''}
          ,
          {' '}
          {diffHours}
          {' '}
          hora
          {diffHours !== 1 ? 's' : ''}
          {' '}
          y
          {diffMinutes}
          {' '}
          minuto
          {diffMinutes !== 1 ? 's' : ''}
          .
        </div>
      );
    }
    // Caso en el que la cita es futura pero falta más de un día
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return (
      <div>
        El canal se habilitará a las
        {' '}
        {meetingCita.startTime}
        . Falta:
        {' '}
        {diffDays}
        {' '}
        día
        {diffDays !== 1 ? 's' : ''}
        ,
        {diffHours}
        {' '}
        hora
        {diffHours !== 1 ? 's' : ''}
        {' '}
        y
        {diffMinutes}
        {' '}
        minuto
        {diffMinutes !== 1 ? 's' : ''}
        {' '}
        para la cita.
      </div>
    );
  }

  const meetingParams = {
    channelId: meetingCita.uid,
    startTime: meetingCita.startTime,
  };

  if (userCollection === 'users') {
    return <UserView meetingParams={meetingParams} RtcRole="uidGuest" />;
  } if (userCollection === 'pros') {
    return <ProView meetingParams={meetingParams} RtcRole="uidHost" />;
  }

  return <div>No se pudo determinar el tipo de usuario.</div>;
};

GlobMeeting.propTypes = {
  collection: PropTypes.string,
  cita: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    date: PropTypes.number.isRequired,
    month: PropTypes.string.isRequired,
  }).isRequired,
};

GlobMeeting.defaultProps = {
  collection: '',
};

export default GlobMeeting;
