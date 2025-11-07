import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const Therapies = () => {
  const [terapiasUser, setTerapiasUser] = useState([]);
  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const { uid } = user;
          const docRef = doc(firestore, 'pros', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Puede ser array de strings o array de objetos { name, price }
            setTerapiasUser(Array.isArray(data.terapias) ? data.terapias : []);
          } else {
            // document not found: manejar sin romper
            console.warn('No user data found in Firestore for pros/', uid);
            setTerapiasUser([]);
          }
        } catch (err) {
          console.error('Error fetching pros document:', err);
          setTerapiasUser([]);
        }
      } else {
        setTerapiasUser([]);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const normalizeText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  // helper: obtiene el nombre de la terapia desde string u objeto
  const getTherapyNameFromItem = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    // si es objeto, preferimos la propiedad 'name', sino 'Nombre', sino ''
    return item.name || item.Nombre || item.terapia || '';
  };

  const therapies = ['Física', 'Lenguaje', 'Mental', 'Ocupacional'];

  return (
    <div className="therapies">
      <div className="therapies-title">
        <h1>Terapias disponibles:</h1>
      </div>
      <div className="Therapies-cont">
        {therapies.map((therapy) => {
          const normalizedTherapy = normalizeText(therapy);
          const isActive = terapiasUser.some((item) => {
            const name = getTherapyNameFromItem(item);
            return normalizeText(name) === normalizedTherapy;
          });

          return (
            <div
              key={`therapy-${therapy}`}
              className={isActive ? 'thera-cont-act' : 'thera-cont'}
            >
              {therapy}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Therapies;
