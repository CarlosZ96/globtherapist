/* eslint-disable consistent-return */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { doc, getDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase';
import User from '../img/user.png';

const Hdvwindow = ({ proId, onClose }) => {
  const [proData, setProData] = useState(null);
  const [profileImage, setProfileImage] = useState(User);
  const [proName, setProName] = useState('');

  useEffect(() => {
    if (!proId) return;

    let cancelled = false;

    const fetchProData = async () => {
      try {
        const proDoc = await getDoc(doc(db, 'pros', proId));
        if (!proDoc.exists()) {
          console.error('No se encontró el profesional en Firestore.');
          if (!cancelled) {
            setProData({});
            setProName('');
            setProfileImage(User);
          }
          return;
        }

        const data = proDoc.data();
        const nameFromRoot = data.name || data.Name || data.nombre || data.Nombre || '';
        if (!cancelled) setProName(nameFromRoot);

        // Hdv (datos biográficos)
        const hdvData = data.Hdv || {};
        if (!cancelled) setProData(hdvData);

        const profileImageUrlFromHdv = hdvData?.files?.profileImageUrl
         || hdvData?.files?.profileImageURL || null;
        const profileImageFileName = hdvData?.files?.profileImageFileName
          || hdvData?.files?.profileImageName
          || data?.files?.profileImageFileName
          || data?.files?.profileImageName
          || null;

        // Si ya hay una URL directa, usarla
        if (profileImageUrlFromHdv) {
          if (!cancelled) setProfileImage(profileImageUrlFromHdv);
          return;
        }

        // Si hay un nombre de archivo, intentar obtener URL desde Storage
        if (profileImageFileName) {
          try {
            const storage = getStorage(); // usa la app inicializada
            const imageRef = storageRef(storage, `profileImages/${proId}/${profileImageFileName}`);
            const url = await getDownloadURL(imageRef);
            if (!cancelled) setProfileImage(url);
            return;
          } catch (err) {
            console.warn('No se pudo obtener la imagen desde Storage:', err);
            // caemos al fallback
          }
        }

        // Si no se encontró nada, fallback
        if (!cancelled) setProfileImage(User);
      } catch (error) {
        console.error('Error obteniendo datos del profesional:', error);
        if (!cancelled) {
          setProData({});
          setProName('');
          setProfileImage(User);
        }
      }
    };

    fetchProData();

    return () => {
      cancelled = true;
    };
  }, [proId]);

  if (!proData) {
    return <div className="modal-overlay"><div className="modal-content">Cargando...</div></div>;
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

        {/* Nombre a nivel raíz del documento (si está disponible) */}
        <h2>{proName || proData?.name || 'Nombre no disponible'}</h2>

        {/* Datos desde Hdv */}
        <h3>{proData.profession || 'Profesión no disponible'}</h3>
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
