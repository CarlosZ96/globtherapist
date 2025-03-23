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
                  </div>
                  <div className="prospace-request-txt-cont">
                    <div className="prospace-request-txt">
                      <h1>Hola, user</h1>
                      <p>
                        Antes de continuar tenemos que validar tus datos.
                      </p>
                    </div>
                    <div>
                      <h2>¿POR QUE?</h2>
                    </div>
                  </div>
                </div>
                <div className="prospace-explain-cont">
                  <p>
                    Now that we will work together to help
                    our users live a healthier life,
                    we need to build trust, which is why we must validate
                    how professional you are!
                  </p>
                  <button type="button">Ir</button>
                </div>
              </div>
            ) : (
              <div className="waiting-cont">
                <h1 className="waiting-title">Estamos revisdando tus datos</h1>
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
                        Tardaremos de 2 a 3 dias habiles en validar tu informacion
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
