import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import User from '../img/user.png';

const Hdvwindow = ({ proId, onClose }) => {
  const [proData, setProData] = useState(null);
  const [profileImage, setProfileImage] = useState(User);

  useEffect(() => {
    if (!proId) return;
    const fetchProData = async () => {
      try {
        const proDoc = await getDoc(doc(db, 'pros', proId));
        if (proDoc.exists()) {
          const data = proDoc.data();
          // Acceder al mapa Hdv dentro del documento
          const hdvData = data.Hdv || {};
          setProData(hdvData); // Guardar solo los datos de Hdv

          // Verificar imagen de perfil (ajusta la ruta si está dentro de Hdv)
          if (hdvData.files && hdvData.files.profileImageUrl) {
            setProfileImage(hdvData.files.profileImageUrl);
          } else {
            setProfileImage(User);
          }
        } else {
          console.error('No se encontró el profesional en Firestore.');
          setProData({});
        }
      } catch (error) {
        console.error('Error obteniendo datos del profesional:', error);
      }
    };

    fetchProData();
  }, [proId]);

  if (!proData) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button type="button" className="close-button" onClick={onClose}>
          &times;
        </button>
        <div className="user-image-comt">
          <img src={profileImage} alt="Perfil profesional" className="pro-img" />
        </div>
        <h2>{proData.profession || 'Profesión no disponible'}</h2>
        <p>
          <strong>Especialización:</strong>
          {' '}
          {proData.specialization || 'No disponible'}
        </p>
        <p>
          <strong>Años de experiencia:</strong>
          {' '}
          {proData.yearsOfExperience || 'No disponible'}
        </p>
        <p>
          <strong>Egresado en:</strong>
          {' '}
          {proData.university || 'No disponible'}
        </p>
        <p>
          <strong>Historia profesional:</strong>
          {' '}
          {proData.professionalHistory || 'No disponible'}
        </p>
      </div>
    </div>
  );
};

Hdvwindow.propTypes = {
  proId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Hdvwindow;
