import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import Calendar from './Calendar/CalendarWithToggle';
import ProData from './ProData';
import Hdv from './Hdv';
import her from '../img/Heykiyou 1.png';
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
        <div className="prospace-apro">
          <div className="prospace-title-cont">
            <h1>GLOBTHERAPIST</h1>
          </div>
          <div className="prospace-status-cont">
            <div className="prospace-status-create-cont">
              <div className="prospace-request-cont">
                <div className="prospace-request-img-cont">
                  <img src={her} className="her-img" alt="" />
                </div>
                <div className="prospace-request-txt-cont">
                  <div>
                    <h1>Hola, user</h1>
                  </div>
                  <div>
                    <h2>¿POR QUE?</h2>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      <ProData />
      <Hdv />
    </div>
  );
};

export default ProSpace;
