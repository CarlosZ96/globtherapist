import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import Calendar from './Calendar/CalendarWithToggle';
import ProData from './ProData';
import Hdv from './Hdv';
import '../stylesheets/prospace.css';

const ProSpace = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const proDocRef = doc(db, 'pros', user.uid);
          const docSnap = await getDoc(proDocRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setStatus(userData.status);
          } else {
            setStatus(null);
          }
        } catch (error) {
          console.error('Error al obtener los datos del pro:', error);
          setStatus(null);
        }
      } else {
        // Si no hay usuario autenticado
        setStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="prospace-cont">
      {status === 'aprobado' ? (
        <Calendar collection="pros" />
      ) : (
        <div>
          <h1>Estamos validando tus datos</h1>
        </div>
      )}
      <ProData />
      <Hdv />
    </div>
  );
};

export default ProSpace;
