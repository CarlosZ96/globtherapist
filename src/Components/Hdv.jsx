/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { db, storage } from '../firebase';
import '../stylesheets/prospace.css';
import User from '../img/user.png';
import { getValidationEmailHtml } from './mails/emailTemplate';
import { useAuth } from '../AuthContext';

const Hdv = () => {
  const { currentPro, currentUser } = useAuth();
  const [profileImage, setProfileImage] = useState(User);
  const [profession, setProfession] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [university, setUniversity] = useState('');
  const [professionalHistory, setProfessionalHistory] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (currentUser) {
        const imageRef = ref(storage, `profileImages/${currentUser.uid}`);
        try {
          const url = await getDownloadURL(imageRef);
          setProfileImage(url);
        } catch (error) {
          console.error('Error fetching profile image:', error);
          setProfileImage(User);
        }
      }
    };

    if (currentPro && currentPro.Hdv) {
      const hdvData = currentPro.Hdv;
      setProfession(hdvData.profession || '');
      setSpecialization(hdvData.specialization || '');
      setYearsOfExperience(hdvData.yearsOfExperience || 0);
      setUniversity(hdvData.university || '');
      setProfessionalHistory(hdvData.professionalHistory || '');
      setInitialDataLoaded(true);
    }

    fetchProfileImage();
  }, [currentPro, currentUser]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!currentUser) return;

    const proRef = doc(db, 'pros', currentUser.uid);
    const hdvData = {
      profession,
      specialization,
      yearsOfExperience,
      university,
      professionalHistory,
    };

    try {
      await setDoc(proRef, { Hdv: hdvData }, { merge: true });
      if (!initialDataLoaded) {
        await updateDoc(proRef, { status: 'pendiente' });
        console.log('Status actualizado a pendiente');

        const emailContent = getValidationEmailHtml();
        await setDoc(doc(db, 'mail', currentUser.uid), {
          to: currentUser.email,
          message: {
            subject: 'Estamos revisando tus datos',
            html: emailContent,
          },
        });
        console.log('Correo de validación enviado al pro:', currentUser.email);

        setInitialDataLoaded(true);
      }

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Datos de HDV actualizados correctamente',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#f0f9ff',
        iconColor: '#4ade80',
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error guardando datos en Firestore:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al guardar los datos',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasExistingData = initialDataLoaded && (
    profession || specialization || yearsOfExperience || university || professionalHistory
  );

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

          {hasExistingData && !isEditing && (
            <button
              type="button"
              className="edit-btn"
              onClick={handleEdit}
              disabled={isLoading}
            >
              Editar
            </button>
          )}

          <h2>{currentPro?.Nombre || 'Nombre del profesional'}</h2>
        </div>

        <div className="fields-cont">
          <div className="hdv-field-cont">
            <h3>Profesional en:</h3>
            <input
              type="text"
              className="specialization"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              disabled={hasExistingData && !isEditing}
            />
          </div>

          <div className="hdv-field-cont">
            <h3>Especialización en:</h3>
            <input
              type="text"
              className="specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              disabled={hasExistingData && !isEditing}
            />
          </div>

          <div className="hdv-field-cont">
            <h3>Egresado en:</h3>
            <input
              type="text"
              className="specialization"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              disabled={hasExistingData && !isEditing}
            />
          </div>

          <div className="hdv-years-cont">
            <h3>Años de experiencia:</h3>
            <input
              type="number"
              name="hdv-year"
              className="hdv-year"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(parseInt(e.target.value, 10) || 0)}
              min="0"
              disabled={hasExistingData && !isEditing}
            />
          </div>

          <div className="hdv-desc-cont">
            <h3>Cuéntanos brevemente tu historia profesional:</h3>
            <textarea
              className="hdv-desc"
              value={professionalHistory}
              onChange={(e) => setProfessionalHistory(e.target.value)}
              disabled={hasExistingData && !isEditing}
            />
          </div>
        </div>

        {(isEditing || !hasExistingData) && (
          <div className="pp-submit">
            <button
              type="submit"
              disabled={isLoading}
              className={`save-btn ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <div className="spinner" />
              ) : (
                hasExistingData ? 'Guardar cambios' : 'Confirmar'
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Hdv;
