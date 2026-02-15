/* eslint-disable max-len */
/* eslint-disable react-hooks/rules-of-hooks */
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
  // Si hay citaGlobal en el contexto, se usa; de lo contrario se usa la prop cita.
  const meetingCita = (citaGlobal && citaGlobal.uid) ? citaGlobal : cita;

  // Verificación mínima de datos
  if (!meetingCita || !meetingCita.month || !meetingCita.startTime || !meetingCita.date) {
    return <div>Error: Información de cita incompleta.</div>;
  }

  if (!currentUser) {
    return <div>Cargando usuario...</div>;
  }

  const [userCollection, setUserCollection] = useState(null);
  const [isWithinOneDay, setIsWithinOneDay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agoraToken, setAgoraToken] = useState(null);

  // Verifica en qué colección se encuentra el usuario
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

  // Cuando la cita esté dentro de 24 horas, llama a la función para obtener el token
  useEffect(() => {
    if (!isWithinOneDay || !meetingCita.uid || !userCollection) return;
    // Determina el rol: para usuarios es "uidGuest" y para profesionales es "uidHost"
    const roleParam = 'uidHost';
    // Construye la URL de la función; se asume que la URL base está en REACT_APP_FUNCTIONS_BASE_URL
    const tokenURL = `${process.env.REACT_APP_FUNCTIONS_BASE_URL}/createAgoraToken`;
    // Aquí usamos meetingCita.uid como channelId;
    //  el parámetro uid se envía como 0 (o puedes ajustar según convenga)
    const url = `${tokenURL}?channelId=${meetingCita.uid}&role=${roleParam}&uid=0`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          setAgoraToken(data.token);
        } else {
          console.error('Error al obtener token:', data);
        }
      })
      .catch((error) => {
        console.error('Error al llamar a createAgoraToken:', error);
      });
  }, [isWithinOneDay, meetingCita.uid, userCollection]);

  if (loading) return <div>Loading...</div>;
  if (!userCollection) {
    return <div>Error: no se encontró la colección para el usuario.</div>;
  }

  // Recalcula la fecha de la cita para mostrar
  // información de espera si es que aún falta más de un día
  const currentYear = nowBogota.getFullYear();
  const monthNum = monthMapping[meetingCita.month.toLowerCase()];
  const [apptHours, apptMinutes] = convertTimeTo24(meetingCita.startTime);
  const appointmentDate = new Date(currentYear, monthNum, meetingCita.date, apptHours, apptMinutes);
  const diffMs = appointmentDate - nowBogota;

  // Si la cita está en el futuro pero falta más de un día, muestra mensaje de espera
  if (!isWithinOneDay) {
    if (diffMs < 0) {
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
        {' '}
        para la cita.
      </div>
    );
  }

  // Mientras esperamos el token, mostramos un indicador de carga
  if (!agoraToken) {
    return <div>Generando token para la videollamada...</div>;
  }

  // Construye los parámetros de la reunión incluyendo el token obtenido
  const meetingParams = {
    channelId: meetingCita.uid,
    startTime: meetingCita.startTime,
    token: agoraToken,
  };

  // Renderiza el componente de vista según la colección del usuario
  if (userCollection === 'users') {
    return <UserView meetingParams={meetingParams} RtcRole="uidGuest" />;
  } if (userCollection === 'pros') {
    return <ProView meetingParams={meetingParams} />;
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
