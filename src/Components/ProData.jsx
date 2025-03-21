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
  // Para la imagen de perfil se separa la URL y el archivo original
  const [profileImageUrl, setProfileImageUrl] = useState(User);
  const [profileImageFile, setProfileImageFile] = useState(null);

  const [hdvFile, setHdvFile] = useState(null);
  const [professionalCardFile, setProfessionalCardFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);

  // Función para subir un archivo y retornar su URL
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
    // Ahora también se requiere que profileImageFile esté definido
    if (!hdvFile || !profileImageFile || !professionalCardFile) {
      alert('HDV, la imagen de perfil y la tarjeta profesional son obligatorios');
      return;
    }

    // Subir cada archivo y obtener sus URLs
    const hdvUrl = await handleFileUpload(hdvFile, 'hdvFiles');
    const professionalCardUrl = await handleFileUpload(professionalCardFile, 'professionalCards');
    // Nota: para la imagen de perfil ya se subió en handleProfileImageChange, pero si deseas
    // "refrescar" o asegurarte de guardar la versión subida, puedes volver a subirla:
    // const profileImageUploadedUrl = await handleFileUpload(profileImageFile, 'profileImages');
    // En este ejemplo, usaremos la URL ya guardada en profileImageUrl.

    const certificateUrls = await Promise.all(
      certificateFiles.map((file) => handleFileUpload(file, 'certificates')),
    );

    // Construir el objeto con la información de los archivos
    const filesData = {
      profileImageFileName: profileImageFile.name,
      profileImageUrl, // URL obtenida en handleProfileImageChange
      hdvFileName: hdvFile.name,
      hdvUrl,
      professionalCardFileName: professionalCardFile.name,
      professionalCardUrl,
      // Guardamos los certificados como un arreglo de objetos con nombre y URL
      certificateFiles: certificateFiles.map((file, index) => ({
        fileName: file.name,
        url: certificateUrls[index],
      })),
    };

    // Actualizar el documento del usuario (en este ejemplo, en la colección 'pros')
    try {
      const userDocRef = doc(db, 'pros', currentUser.uid);
      await updateDoc(userDocRef, {
        files: filesData,
      });
      console.log('Datos de archivos guardados:', filesData);
      alert('¡Archivos subidos y datos guardados correctamente!');
    } catch (error) {
      console.error('Error al guardar la información de archivos:', error);
      alert('Hubo un error al guardar la información de archivos.');
    }
  };

  return (
    <div className="prodata-cont">
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
            <button type="button">Cambiar imagen</button>
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
          {/* Input personalizado para HDV */}
          <div className="hdv-cont">
            <label htmlFor="hdvInput" className="upload-hdv">
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
          {/* Input personalizado para Tarjeta Profesional */}
          <div className="pro-professional-card">
            <label htmlFor="proCardInput" className="upload-hdv">
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
          {/* Input personalizado para Certificados */}
          <div className="pro-certificates-cont">
            <label htmlFor="certificateInput" className="upload-hdv">
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
        <div className="pro-button-cont">
          <button type="submit" onClick={handleSubmit}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
};

export default ProData;
