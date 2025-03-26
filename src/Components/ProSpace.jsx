import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import Calendar from './Calendar/CalendarWithToggle';
import ProData from './ProData';
import Hdv from './Hdv';
import her from '../img/Heykiyou 1.png';
import reading from '../img/BZZRINCANTATION.png';
import wating from '../img/waitingr 1.png';
import mail from '../img/mailSend.png';
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
            {status === 'creado' ? (
              <div className="prospace-status-create-cont">
                <div className="prospace-request-cont">
                  <div className="prospace-request-img-cont">
                    <img src={her} className="her-img" alt="" />
                    <div className="bubble" />
                    <div className="bubble" />
                  </div>
                  <div className="prospace-request-txt-cont">
                    <div className="prospace-request-txt">
                      <h1>Hola, usuario</h1>
                      <p>
                        Antes de continuar, necesitamos validar tus datos.
                      </p>
                    </div>
                    <div className="why-cont">
                      <h2>¿POR QUÉ?</h2>
                    </div>
                  </div>
                </div>
                <div className="prospace-explain-cont">
                  <div className="prospace-explain-txt-cont">
                    <p>
                      Ahora que trabajaremos juntos para ayudar
                      a nuestros usuarios a vivir una vida más saludable,
                      necesitamos construir confianza, ¡por eso debemos validar
                      qué tan profesional eres!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('prodata-cont')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Ir
                  </button>
                </div>
              </div>
            ) : (
              <div className="waiting-cont">
                <h1 className="waiting-title">Estamos revisando tus datos</h1>
                <div className="waiting-img-cont">
                  <img src={reading} alt="" />
                </div>
                <div className="waiting-time-cont">
                  <div className="waiting-time-img-cont">
                    <img src={wating} alt="" />
                  </div>
                  <div className="waiting-time-txt">
                    <div className="waiting-time-back">
                      <p>
                        Tardaremos de 2 a 3 días hábiles en validar tu información
                      </p>
                      <div className="waiting-send-email">
                        <img src={mail} alt="" />
                        <h4>Te enviaremos la respuesta a tu correo</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <ProData />
      <Hdv />
    </div>
  );
};

export default ProSpace;
