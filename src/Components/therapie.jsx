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
        const { uid } = user;
        const docRef = doc(firestore, 'pros', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.terapias) {
            setTerapiasUser(data.terapias);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const normalizeText = (text) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
          const isActive = terapiasUser.some((item) => normalizeText(item) === normalizedTherapy);
          return (
            <div key={`therapy-${therapy}`} className={isActive ? 'thera-cont-act' : 'thera-cont'}>
              {therapy}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Therapies;
