import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase';
import '../stylesheets/prospace.css';
import User from '../img/user.png';

const Hdv = () => {
  const [profileImage, setProfileImage] = useState(User);
  const [profession, setProfession] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [university, setUniversity] = useState('');
  const [professionalHistory, setProfessionalHistory] = useState('');

  useEffect(() => {
    const fetchProfileImage = async () => {
      const user = auth.currentUser;
      if (user) {
        const imageRef = ref(storage, `profileImages/${user.uid}`);
        try {
          const url = await getDownloadURL(imageRef);
          setProfileImage(url);
        } catch (error) {
          console.error('Error fetching profile image:', error);
          setProfileImage(User);
        }
      }
    };

    fetchProfileImage();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (user) {
      const proRef = doc(db, 'pros', user.uid);
      const hdvData = {
        profession,
        specialization,
        yearsOfExperience,
        university,
        professionalHistory,
      };

      try {
        // Guarda los datos de la historia profesional
        await setDoc(proRef, { Hdv: hdvData }, { merge: true });
        console.log('Datos guardados correctamente en Firestore');

        // Actualiza el status a "pendiente"
        await updateDoc(proRef, { status: 'pendiente' });

        // Limpia el formulario
        setProfession('');
        setSpecialization('');
        setYearsOfExperience(0);
        setUniversity('');
        setProfessionalHistory('');
      } catch (error) {
        console.error('Error guardando datos en Firestore:', error);
      }
    }
  };

  return (
    <div id="pp-cont" className="pp-cont">
      <header className="PP-Title">
        <h1>Mi perfil público</h1>
      </header>
      <form className="pp-form-cont" onSubmit={handleSubmit}>
        <div className="hdv-name-cont">
          <div className="hdv-button-cont">
            <img src={profileImage} alt="user" className="pro-img" />
          </div>
          <button type="button">x</button>
          <h2>Pro name</h2>
        </div>
        <div className="fields-cont">
          <div className="hdv-field-cont">
            <h3>Profesional en:</h3>
            <input
              type="text"
              className="specialization"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            />
          </div>
          <div className="hdv-field-cont">
            <h3>Especialización en:</h3>
            <input
              type="text"
              className="specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
          </div>
          <div className="hdv-field-cont">
            <h3>Egresado en:</h3>
            <input
              type="text"
              className="specialization"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
          </div>
          <div className="hdv-years-cont">
            <h3>Años de experiencia:</h3>
            <input
              type="number"
              name="hdv-year"
              className="hdv-year"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(parseInt(e.target.value, 10))}
              min="0"
            />
          </div>
          <div className="hdv-desc-cont">
            <h3>Cuéntanos brevemente tu historia profesional:</h3>
            <textarea
              className="hdv-desc"
              value={professionalHistory}
              onChange={(e) => setProfessionalHistory(e.target.value)}
            />
          </div>
        </div>
        <div className="pp-submit">
          <button type="submit">Confirmar</button>
        </div>
      </form>
    </div>
  );
};

export default Hdv;
