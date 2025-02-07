import React from 'react';
import PropTypes from 'prop-types';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import User from '../img/user.png';

const Hdvwindow = ({ proId, onClose }) => {
  const [proData, setProData] = React.useState(null);
  const [profileImage, setProfileImage] = React.useState(User);

  React.useEffect(() => {
    const fetchProData = async () => {
      try {
        const proDoc = await getDoc(doc(db, 'pros', proId));
        if (proDoc.exists()) {
          const data = proDoc.data();
          setProData(data.Hdv);
        } else {
          console.error('No se encontró el profesional en Firestore.');
        }
      } catch (error) {
        console.error('Error obteniendo datos del profesional:', error);
      }
    };

    fetchProData();
  }, [proId]);

  React.useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const imageRef = ref(storage, `profileImages/${proId}/profile.jpg`);
        const url = await getDownloadURL(imageRef);
        setProfileImage(url);
      } catch (error) {
        console.error('Error obteniendo la imagen de perfil:', error);
        setProfileImage(User);
      }
    };

    fetchProfileImage();
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
          <img src={profileImage} alt="user" className="pro-img" />
        </div>
        <h2>{proData.profession}</h2>
        <p>
          <strong>Especialización:</strong>
          {' '}
          {proData.specialization}
        </p>
        <p>
          <strong>Años de experiencia:</strong>
          {' '}
          {proData.yearsOfExperience}
        </p>
        <p>
          <strong>Egresado en:</strong>
          {' '}
          {proData.university}
        </p>
        <p>
          <strong>Historia profesional:</strong>
          {' '}
          {proData.professionalHistory}
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
