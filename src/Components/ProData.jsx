/* eslint-disable consistent-return */
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import User from '../img/user.png';
import '../stylesheets/prospace.css';
import { useAuth } from '../AuthContext';
import { storage } from '../firebase';

const ProData = () => {
  const { currentUser, currentPro } = useAuth();
  const [profileImage, setProfileImage] = useState(User);
  const [hdvFile, setHdvFile] = useState(null);
  const [professionalCardFile, setProfessionalCardFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);

  const handleFileUpload = async (file, path) => {
    if (!file || !currentUser) return;
    const fileRef = ref(storage, `${path}/${currentUser.uid}/${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await handleFileUpload(file, 'profileImages');
      setProfileImage(url);
    }
  };

  const handleHdvChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setHdvFile(file);
    }
  };

  const handleProfessionalCardChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfessionalCardFile(file);
    }
  };

  const handleCertificateChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFiles([...certificateFiles, file]);
    }
  };

  const handleSubmit = async () => {
    if (!hdvFile || !profileImage || !professionalCardFile) {
      alert('HDV, la imagen de perfil y la tarjeta profesional son obligatorios');
      return;
    }

    const hdvUrl = await handleFileUpload(hdvFile, 'hdvFiles');
    const profileImageUrl = await handleFileUpload(profileImage, 'profileImages');
    const professionalCardUrl = await handleFileUpload(professionalCardFile, 'professionalCards'); // Subir tarjeta profesional
    const certificateUrls = await Promise.all(certificateFiles.map((file) => handleFileUpload(file, 'certificates')));

    console.log('HDV URL:', hdvUrl);
    console.log('Profile Image URL:', profileImageUrl);
    console.log('Professional Card URL:', professionalCardUrl);
    console.log('Certificate URLs:', certificateUrls);
  };

  return (
    <div className="prodata-cont">
      <div className="prodata-title">
        <h1>Mis datos</h1>
      </div>
      <div className="data-cont">
        <div className="pro-name-cont">
          <div className="user-image-cont">
            <img src={profileImage} alt="user" className="pro-img" />
            <input type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display: 'none' }} id="profileImageInput" />
            <button type="button" onClick={() => document.getElementById('profileImageInput').click()}>Cambiar imagen</button>
          </div>
          <h2 className="pro-name">{currentPro?.Nombre || 'pro name'}</h2>
        </div>
        <div className="pro-personal-info">
          <div className="hdv-cont">
            <h3 className="upload-hdv">Subir HDV</h3>
            <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleHdvChange} />
          </div>
          <div className="pro-professional-card">
            <h3>Subir tarjeta profesional</h3>
            <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" onChange={handleProfessionalCardChange} />
          </div>
          <div className="personal-info-files-cont">
            <p>
              Email:
              {' '}
              {currentPro?.email}
            </p>
            <p>
              Teléfono:
              {' '}
              {currentPro?.telefono}
            </p>
            <p>
              Documento:
              {' '}
              {currentPro?.Documento?.type}
              {' '}
              {currentPro?.Documento?.number}
            </p>
          </div>
          <div className="pro-certificates-cont">
            <div className="upload-certificate">
              <h3>Subir certificado</h3>
              <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" onChange={handleCertificateChange} />
            </div>
            {certificateFiles.map((file) => (
              <div key={file.name} className="pro-certificate">
                {file.name}
              </div>
            ))}
          </div>
        </div>
        <div className="pro-button-cont">
          <button type="submit" onClick={handleSubmit}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
};

export default ProData;
