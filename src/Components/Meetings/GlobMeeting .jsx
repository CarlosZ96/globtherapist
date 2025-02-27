/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import UserView from './UserView';
import ProView from './ProView';
import { useAuth } from '../../AuthContext'; // Asegúrate de que la ruta sea la correcta

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
  // Obtenemos currentUser desde el contexto global
  const { currentUser } = useAuth();

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
        // Si se recibe la prop "collection", se intenta primero en esa colección
        if (collection) {
          const docRef = doc(db, collection, currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            foundCollection = collection;
          }
        }
        // Si no se encontró o no se pasó "collection", se busca en "users"
        if (!foundCollection) {
          const usersRef = doc(db, 'users', currentUser.uid);
          const snapUsers = await getDoc(usersRef);
          if (snapUsers.exists()) {
            foundCollection = 'users';
          }
        }
        // Si aún no se encontró, se busca en "pros"
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

  // Comprueba si la cita está a 1 día o menos de distancia (y es futura)
  useEffect(() => {
    if (!cita || !cita.startTime || !cita.date || !cita.month) return;

    const currentYear = new Date().getFullYear();
    const monthNum = monthMapping[cita.month.toLowerCase()];
    const [hours, minutes] = cita.startTime.split(':').map(Number);
    const appointmentDate = new Date(currentYear, monthNum, cita.date, hours, minutes);
    const now = new Date();
    const diff = appointmentDate - now;
    const oneDayMs = 24 * 60 * 60 * 1000;

    setIsWithinOneDay(diff <= oneDayMs && diff > 0);
  }, [cita]);

  if (loading) return <div>Loading...</div>;

  if (!userCollection) {
    return <div>Error: no se encontró la colección para el usuario.</div>;
  }

  if (!isWithinOneDay) {
    return <div>El canal se habilitará un día antes de la cita.</div>;
  }

  const meetingParams = {
    channelId: cita.uid,
    startTime: cita.startTime,
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
