/* eslint-disable consistent-return */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import User from '../img/user.png';
import Upload from '../img/Upload.png';
import '../stylesheets/prospace.css';
import { useAuth } from '../AuthContext';
import { storage, db } from '../firebase';

const ProData = () => {
  const { currentUser, currentPro } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState(User);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [hdvFile, setHdvFile] = useState(null);
  const [professionalCardFile, setProfessionalCardFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [formDisabled, setFormDisabled] = useState(false);
  const handleFileUpload = async (file, path) => {
    if (!file || !currentUser) return;
    const fileRef = ref(storage, `${path}/${currentUser.uid}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    console.log('File uploaded successfully. Download URL:', downloadURL);
    return downloadURL;
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await handleFileUpload(file, 'profileImages');
      setProfileImageUrl(url);
      setProfileImageFile(file);
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
    if (!hdvFile || !profileImageFile || !professionalCardFile) {
      alert('HDV, la imagen de perfil y la tarjeta profesional son obligatorios');
      return;
    }

    const hdvUrl = await handleFileUpload(hdvFile, 'hdvFiles');
    const professionalCardUrl = await handleFileUpload(professionalCardFile, 'professionalCards');
    const certificateUrls = await Promise.all(
      certificateFiles.map((file) => handleFileUpload(file, 'certificates')),
    );

    const filesData = {
      profileImageFileName: profileImageFile.name,
      profileImageUrl,
      hdvFileName: hdvFile.name,
      hdvUrl,
      professionalCardFileName: professionalCardFile.name,
      professionalCardUrl,
      certificateFiles: certificateFiles.map((file, index) => ({
        fileName: file.name,
        url: certificateUrls[index],
      })),
    };

    try {
      const userDocRef = doc(db, 'pros', currentUser.uid);
      await updateDoc(userDocRef, {
        files: filesData,
      });
      console.log('Datos de archivos guardados:', filesData);
      alert('¡Archivos subidos y datos guardados correctamente!');
      setFormDisabled(true);
    } catch (error) {
      console.error('Error al guardar la información de archivos:', error);
      alert('Hubo un error al guardar la información de archivos.');
    }
  };

  return (
    <div id="prodata-cont" className="prodata-cont">
      <div className="prodata-title">
        <div className="question-cont">
          <h1>?</h1>
        </div>
        <h1>Mis datos</h1>
      </div>
      <div className="data-cont">
        <div className="pro-name-cont">
          <div
            className="user-image-cont"
            onClick={() => document.getElementById('profileImageInput').click()}
          >
            <img src={profileImageUrl} alt="user" className="pro-img" />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              style={{ display: 'none' }}
              id="profileImageInput"
            />
            <button type="button" disabled={formDisabled}>Cambiar imagen</button>
          </div>
          <h2 className="pro-name">{currentPro?.Nombre || 'pro name'}</h2>
        </div>
        <div className="pro-personal-info">
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
          <div className="hdv-cont">
            <label disabled={formDisabled} htmlFor="hdvInput" className="upload-hdv">
              <img src={Upload} alt="" />
              <h3>Subir HDV</h3>
            </label>
            <input
              id="hdvInput"
              type="file"
              accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleHdvChange}
              style={{ display: 'none' }}
            />
            {hdvFile && <p className="file-name">{hdvFile.name}</p>}
          </div>
          <div className="pro-professional-card">
            <label disabled={formDisabled} htmlFor="proCardInput" className="upload-hdv">
              <img src={Upload} alt="" />
              <h3>Subir tarjeta profesional</h3>
            </label>
            <input
              id="proCardInput"
              type="file"
              accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/*"
              onChange={handleProfessionalCardChange}
              style={{ display: 'none' }}
            />
            {professionalCardFile && (
              <p className="file-name">{professionalCardFile.name}</p>
            )}
          </div>
          <div className="pro-certificates-cont">
            <label disabled={formDisabled} htmlFor="certificateInput" className="upload-hdv">
              <img src={Upload} alt="" />
              <h3>Subir tus certificados</h3>
            </label>
            <input
              id="certificateInput"
              type="file"
              accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/*"
              onChange={handleCertificateChange}
              style={{ display: 'none' }}
            />
            {certificateFiles.map((file) => (
              <div key={file.name} className="pro-certificate">
                {file.name}
              </div>
            ))}
          </div>
        </div>
        <button type="submit" onClick={handleSubmit} disabled={formDisabled}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
};

export default ProData;
