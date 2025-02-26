import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import UserView from './UserView';
import ProView from './ProView';

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
  const auth = getAuth();
  const { currentUser } = auth;
  const [userCollection, setUserCollection] = useState(null);
  const [isWithinOneDay, setIsWithinOneDay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserCollection = async () => {
      if (!currentUser) return;
      const docRef = doc(db, collection, currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setUserCollection(collection);
      } else {
        const otherCollection = collection === 'users' ? 'pros' : 'users';
        const otherRef = doc(db, otherCollection, currentUser.uid);
        const otherSnap = await getDoc(otherRef);
        if (otherSnap.exists()) {
          setUserCollection(otherCollection);
        }
      }
      setLoading(false);
    };
    checkUserCollection();
  }, [collection, currentUser]);

  // Comprueba si la cita está a 1 día o menos de distancia (y es futura)
  useEffect(() => {
    if (!cita || !cita.startTime || !cita.date || !cita.month) return;

    const currentYear = new Date().getFullYear();
    const monthNum = monthMapping[cita.month.toLowerCase()];
    // Se espera que cita.startTime tenga el formato "HH:mm"
    const [hours, minutes] = cita.startTime.split(':').map(Number);
    const appointmentDate = new Date(currentYear, monthNum, cita.date, hours, minutes);
    const now = new Date();
    const diff = appointmentDate - now;
    const oneDayMs = 24 * 60 * 60 * 1000;

    // La cita debe ser en el futuro y faltar 24 horas o menos
    setIsWithinOneDay(diff <= oneDayMs && diff > 0);
  }, [cita]);

  if (loading) return <div>Loading...</div>;

  // Si la cita no está próxima, muestra un mensaje
  if (!isWithinOneDay) {
    return <div>El canal se habilitará un día antes de la cita.</div>;
  }

  // Prepara los parámetros para la creación del canal/videollamada en Agora.
  // Se usa cita.uid como identificador del canal (ajusta según sea necesario).
  const meetingParams = {
    channelId: cita.uid,
    startTime: cita.startTime,
    // Puedes agregar aquí otros parámetros que requiera la API de Agora
  };

  if (userCollection === 'users') {
    return <UserView meetingParams={meetingParams} RtcRole="uidGuest" />;
  } if (userCollection === 'pros') {
    return <ProView meetingParams={meetingParams} RtcRole="uidHost" />;
  }
  return <div>No se pudo determinar el tipo de usuario.</div>;
};
GlobMeeting.propTypes = {
  collection: PropTypes.string.isRequired,
  cita: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    date: PropTypes.number.isRequired,
    month: PropTypes.string.isRequired,
  }).isRequired,
};

export default GlobMeeting;
