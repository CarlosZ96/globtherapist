/* eslint-disable max-len */
/* eslint-disable consistent-return */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ref, uploadBytes, getDownloadURL, listAll, deleteObject,
} from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import User from '../img/user.png';
import Upload from '../img/Upload.png';
import '../stylesheets/prospace.css';
import { useAuth } from '../AuthContext';
import { storage, db } from '../firebase';

const ProData = ({ onFilesUploaded }) => {
  const { currentUser, currentPro } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState(User);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [hdvFile, setHdvFile] = useState(null);
  const [professionalCardFile, setProfessionalCardFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [editingCertificates, setEditingCertificates] = useState(false);

  const handleEditCertificates = () => {
    setEditingCertificates(true);
    setCertificateFiles([]);
  };

  const [existingFiles, setExistingFiles] = useState({
    profileImage: null,
    hdv: null,
    professionalCard: null,
    certificates: [],
  });
  const [editingFile, setEditingFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener archivos existentes al cargar el componente
  useEffect(() => {
    const fetchExistingFiles = async () => {
      if (!currentUser) return;

      try {
        // Obtener archivo de perfil más reciente
        const profileRef = ref(storage, `profileImages/${currentUser.uid}`);
        const profileList = await listAll(profileRef);
        if (profileList.items.length > 0) {
          const sortedProfile = [...profileList.items].sort((a, b) => b.timeCreated.localeCompare(a.timeCreated));
          const latestProfile = sortedProfile[0];
          const url = await getDownloadURL(latestProfile);
          setExistingFiles((prev) => ({
            ...prev,
            profileImage: { name: latestProfile.name, url },
          }));
          setProfileImageUrl(url);
        }

        // Obtener HDV más reciente
        const hdvRef = ref(storage, `hdvFiles/${currentUser.uid}`);
        const hdvList = await listAll(hdvRef);
        if (hdvList.items.length > 0) {
          const sortedHdv = [...hdvList.items].sort((a, b) => b.timeCreated.localeCompare(a.timeCreated));
          const latestHdv = sortedHdv[0];
          const url = await getDownloadURL(latestHdv);
          setExistingFiles((prev) => ({
            ...prev,
            hdv: { name: latestHdv.name, url },
          }));
        }

        // Obtener tarjeta profesional más reciente
        const proCardRef = ref(storage, `professionalCards/${currentUser.uid}`);
        const proCardList = await listAll(proCardRef);
        if (proCardList.items.length > 0) {
          const sortedProCard = [...proCardList.items].sort((a, b) => b.timeCreated.localeCompare(a.timeCreated));
          const latestProCard = sortedProCard[0];
          const url = await getDownloadURL(latestProCard);
          setExistingFiles((prev) => ({
            ...prev,
            professionalCard: { name: latestProCard.name, url },
          }));
        }

        // Obtener todos los certificados
        const certRef = ref(storage, `certificates/${currentUser.uid}`);
        const certList = await listAll(certRef);
        if (certList.items.length > 0) {
          const certs = await Promise.all(certList.items.map(async (item) => {
            const url = await getDownloadURL(item);
            return { name: item.name, url };
          }));
          setExistingFiles((prev) => ({
            ...prev,
            certificates: certs,
          }));
        }
      } catch (error) {
        console.error('Error al obtener archivos existentes:', error);
      }
    };

    fetchExistingFiles();
  }, [currentUser]);

  // Eliminar todos los archivos en una ruta específica
  const deleteAllFilesInPath = async (path) => {
    try {
      const folderRef = ref(storage, `${path}/${currentUser.uid}`);
      const fileList = await listAll(folderRef);

      await Promise.all(
        fileList.items.map((fileRef) => deleteObject(fileRef)),
      );
    } catch (error) {
      console.error(`Error al eliminar archivos en ${path}:`, error);
    }
  };

  const handleFileUpload = async (file, path, isEditing = false) => {
    if (!file || !currentUser) return;

    // Si estamos editando, eliminar archivos antiguos primero
    if (isEditing) {
      await deleteAllFilesInPath(path);
    }

    const fileRef = ref(storage, `${path}/${currentUser.uid}/${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isEditing = editingFile === 'profileImage';
      const url = await handleFileUpload(file, 'profileImages', isEditing);
      setProfileImageUrl(url);
      setProfileImageFile(file);

      // Actualizar estado de archivo existente
      if (isEditing) {
        setExistingFiles((prev) => ({
          ...prev,
          profileImage: { name: file.name, url },
        }));
        setEditingFile(null);
      }
    }
  };

  const handleHdvChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isEditing = editingFile === 'hdv';
      const url = await handleFileUpload(file, 'hdvFiles', isEditing);
      setHdvFile(file);

      if (isEditing) {
        setExistingFiles((prev) => ({
          ...prev,
          hdv: { name: file.name, url },
        }));
        setEditingFile(null);
      }
    }
  };

  const handleProfessionalCardChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isEditing = editingFile === 'professionalCard';
      const url = await handleFileUpload(file, 'professionalCards', isEditing);
      setProfessionalCardFile(file);

      if (isEditing) {
        setExistingFiles((prev) => ({
          ...prev,
          professionalCard: { name: file.name, url },
        }));
        setEditingFile(null);
      }
    }
  };

  const handleCertificateChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setCertificateFiles(files);
    }
  };

  const handleSubmit = async () => {
    const hasProfile = profileImageFile || existingFiles.profileImage;
    const hasHdv = hdvFile || existingFiles.hdv;
    const hasProCard = professionalCardFile || existingFiles.professionalCard;

    if (!hasProfile || !hasHdv || !hasProCard) {
      Swal.fire({
        icon: 'error',
        title: 'Campos obligatorios',
        text: 'HDV, la imagen de perfil y la tarjeta profesional son obligatorios',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Mostrar notificación de carga
      Swal.fire({
        title: 'Subiendo archivos...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Eliminar archivos existentes en las carpetas que se actualizarán
      await Promise.all([
        profileImageFile && deleteAllFilesInPath('profileImages'),
        hdvFile && deleteAllFilesInPath('hdvFiles'),
        professionalCardFile && deleteAllFilesInPath('professionalCards'),
        (editingCertificates || certificateFiles.length > 0) && deleteAllFilesInPath('certificates'),
      ]);

      // Subir archivos nuevos o usar existentes
      let profileUrl = existingFiles.profileImage?.url;
      let profileFileName = existingFiles.profileImage?.name;
      if (profileImageFile) {
        profileUrl = await handleFileUpload(profileImageFile, 'profileImages');
        profileFileName = profileImageFile.name;
      }

      let hdvUrl = existingFiles.hdv?.url;
      let hdvFileName = existingFiles.hdv?.name;
      if (hdvFile) {
        hdvUrl = await handleFileUpload(hdvFile, 'hdvFiles');
        hdvFileName = hdvFile.name;
      }

      let professionalCardUrl = existingFiles.professionalCard?.url;
      let professionalCardFileName = existingFiles.professionalCard?.name;
      if (professionalCardFile) {
        professionalCardUrl = await handleFileUpload(professionalCardFile, 'professionalCards');
        professionalCardFileName = professionalCardFile.name;
      }

      // Subir certificados nuevos
      const certificateUrls = await Promise.all(
        certificateFiles.map((file) => handleFileUpload(file, 'certificates')),
      );

      // Preparar datos para Firestore
      const filesData = {
        profileImageFileName: profileFileName,
        profileImageUrl: profileUrl,
        hdvFileName,
        hdvUrl,
        professionalCardFileName,
        professionalCardUrl,
        certificateFiles: certificateFiles.map((file, index) => ({
          fileName: file.name,
          url: certificateUrls[index],
        })),
      };

      // Actualizar Firestore
      const userDocRef = doc(db, 'pros', currentUser.uid);
      await updateDoc(userDocRef, { files: filesData });

      // Cerrar notificación de carga
      Swal.close();

      // Mostrar notificación de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Archivos subidos y datos guardados correctamente',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#f0f9ff',
        iconColor: '#4ade80',
      });

      // Resetear estados
      setProfileImageFile(null);
      setHdvFile(null);
      setProfessionalCardFile(null);
      setCertificateFiles([]);
      setEditingFile(null);
      setEditingCertificates(false);

      // Recargar archivos existentes
      const fetchExistingFiles = async () => {
        // ... (código de fetchExistingFiles)
      };
      fetchExistingFiles();

      if (onFilesUploaded) {
        onFilesUploaded();
      }
    } catch (error) {
      console.error('Error al guardar la información de archivos:', error);
      // Cerrar notificación de carga
      Swal.close();

      // Mostrar notificación de error
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al guardar la información de archivos',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
    } finally {
      setIsLoading(false);
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
            onClick={() => !isLoading && document.getElementById('profileImageInput').click()}
          >
            <img src={profileImageUrl} alt="user" className="pro-img" />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              style={{ display: 'none' }}
              id="profileImageInput"
              disabled={isLoading}
            />
            {existingFiles.profileImage && !editingFile ? (
              <button
                type="button"
                onClick={() => setEditingFile('profileImage')}
                disabled={isLoading}
              >
                Editar imagen
              </button>
            ) : (
              <button type="button" disabled={isLoading}>
                Cambiar imagen
              </button>
            )}
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

          {/* Sección HDV */}
          <div className="hdv-cont">
            {existingFiles.hdv && !editingFile ? (
              <div className="file-display">
                <a
                  href={existingFiles.hdv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
                >
                  {existingFiles.hdv.name}
                </a>
                <button
                  className="edit-btn"
                  type="button"
                  onClick={() => setEditingFile('hdv')}
                  disabled={isLoading}
                >
                  Editar
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="hdvInput" className="upload-hdv">
                  <img src={Upload} alt="" />
                  <h3>{editingFile === 'hdv' ? 'Reemplazar HDV' : 'Subir HDV'}</h3>
                </label>
                <input
                  id="hdvInput"
                  type="file"
                  accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleHdvChange}
                  style={{ display: 'none' }}
                  disabled={isLoading}
                />
              </>
            )}
            {hdvFile && <p className="file-name">{hdvFile.name}</p>}
          </div>

          {/* Sección Tarjeta Profesional */}
          <div className="pro-professional-card">
            {existingFiles.professionalCard && !editingFile ? (
              <div className="file-display">
                <a
                  href={existingFiles.professionalCard.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
                >
                  {existingFiles.professionalCard.name}
                </a>
                <button
                  className="edit-btn"
                  type="button"
                  onClick={() => setEditingFile('professionalCard')}
                  disabled={isLoading}
                >
                  Editar
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="proCardInput" className="upload-hdv">
                  <img src={Upload} alt="" />
                  <h3>
                    {editingFile === 'professionalCard'
                      ? 'Reemplazar tarjeta'
                      : 'Subir tarjeta profesional'}
                  </h3>
                </label>
                <input
                  id="proCardInput"
                  type="file"
                  accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/*"
                  onChange={handleProfessionalCardChange}
                  style={{ display: 'none' }}
                  disabled={isLoading}
                />
              </>
            )}
            {professionalCardFile && (
              <p className="file-name">{professionalCardFile.name}</p>
            )}
          </div>

          <div className="pro-certificates-cont">
            {existingFiles.certificates.length > 0 && !editingCertificates ? (
              <div className="certificates-list">
                {existingFiles.certificates.map((cert) => (
                  <div key={cert.url} className="pro-certificate">
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      {cert.name}
                    </a>
                  </div>
                ))}
                <button
                  className="edit-btn"
                  type="button"
                  onClick={handleEditCertificates}
                  disabled={isLoading}
                >
                  Editar
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="certificateInput" className="upload-hdv">
                  <img src={Upload} alt="" />
                  <h3>{editingCertificates ? 'Reemplazar certificados' : 'Subir tus certificados'}</h3>
                </label>
                <input
                  id="certificateInput"
                  type="file"
                  multiple
                  accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/*"
                  onChange={handleCertificateChange}
                  style={{ display: 'none' }}
                  disabled={isLoading}
                />
              </>
            )}

            {certificateFiles.map((file) => (
              <div key={file.name} className="pro-certificate">
                {file.name}
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`save-btn ${isLoading ? 'loading' : ''}`}
        >
          {isLoading ? (
            <div className="spinner" />
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>
    </div>
  );
};

ProData.propTypes = {
  onFilesUploaded: PropTypes.func,
};

ProData.defaultProps = {
  onFilesUploaded: null,
};

export default ProData;
