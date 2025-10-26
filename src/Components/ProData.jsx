/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* ProData.jsx (reemplaza el contenido del componente ProData por este) */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata,
} from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import User from '../img/user.png';
import Upload from '../img/Upload.png';
import edit from '../img/pencil.png';
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

  const [existingFiles, setExistingFiles] = useState({
    profileImage: null,
    hdv: null,
    professionalCard: null,
    certificates: [],
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingHdv, setEditingHdv] = useState(false);
  const [editingProCard, setEditingProCard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditCertificates = () => {
    setEditingCertificates(true);
    setCertificateFiles([]);
  };

  useEffect(() => {
    const fetchExistingFiles = async () => {
      if (!currentUser) return;
      try {
        // profileImages
        const profileRef = ref(storage, `profileImages/${currentUser.uid}`);
        const profileList = await listAll(profileRef);
        if (profileList.items.length > 0) {
          const items = await Promise.all(profileList.items.map(async (item) => {
            const meta = await getMetadata(item);
            const url = await getDownloadURL(item);
            return { name: item.name, url, timeCreated: meta.timeCreated };
          }));
          items.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
          setExistingFiles(
            (prev) => ({ ...prev, profileImage: { name: items[0].name, url: items[0].url } }),
          );
          setProfileImageUrl(items[0].url);
        }

        // hdvFiles
        const hdvRef = ref(storage, `hdvFiles/${currentUser.uid}`);
        const hdvList = await listAll(hdvRef);
        if (hdvList.items.length > 0) {
          const items = await Promise.all(hdvList.items.map(async (item) => {
            const meta = await getMetadata(item);
            const url = await getDownloadURL(item);
            return { name: item.name, url, timeCreated: meta.timeCreated };
          }));
          items.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
          setExistingFiles(
            (prev) => ({ ...prev, hdv: { name: items[0].name, url: items[0].url } }),
          );
        }

        // professionalCards
        const proCardRef = ref(storage, `professionalCards/${currentUser.uid}`);
        const proCardList = await listAll(proCardRef);
        if (proCardList.items.length > 0) {
          const items = await Promise.all(proCardList.items.map(async (item) => {
            const meta = await getMetadata(item);
            const url = await getDownloadURL(item);
            return { name: item.name, url, timeCreated: meta.timeCreated };
          }));
          items.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
          setExistingFiles(
            (prev) => ({ ...prev, professionalCard: { name: items[0].name, url: items[0].url } }),
          );
        }

        // certificates (multiple)
        const certRef = ref(storage, `certificates/${currentUser.uid}`);
        const certList = await listAll(certRef);
        if (certList.items.length > 0) {
          const certs = await Promise.all(certList.items.map(async (item) => {
            const meta = await getMetadata(item);
            const url = await getDownloadURL(item);
            return { name: item.name, url, timeCreated: meta.timeCreated };
          }));
          certs.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
          setExistingFiles(
            (prev) => ({ ...prev, certificates: certs.map((c) => ({ name: c.name, url: c.url })) }),
          );
        }
      } catch (error) {
        console.error('Error al obtener archivos existentes:', error);
      }
    };

    fetchExistingFiles();
  }, [currentUser]);

  const deleteAllFilesInPath = async (path) => {
    try {
      const folderRef = ref(storage, `${path}/${currentUser.uid}`);
      const fileList = await listAll(folderRef);
      await Promise.all(fileList.items.map((fileRef) => deleteObject(fileRef)));
    } catch (error) {
      console.error(`Error al eliminar archivos en ${path}:`, error);
    }
  };

  const handleFileUpload = async (file, path, isEditing = false) => {
    if (!file || !currentUser) return null;
    if (isEditing) {
      await deleteAllFilesInPath(path);
    }
    const fileRef = ref(storage, `${path}/${currentUser.uid}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isEditing = editingProfile;
      const url = await handleFileUpload(file, 'profileImages', isEditing);
      if (url) {
        setProfileImageUrl(url);
        setProfileImageFile(file);
        if (isEditing) {
          setExistingFiles((prev) => ({ ...prev, profileImage: { name: file.name, url } }));
          setEditingProfile(false);
        }
      }
    }
  };

  const handleHdvChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isEditing = editingHdv;
      const url = await handleFileUpload(file, 'hdvFiles', isEditing);
      if (url) {
        setHdvFile(file);
        if (isEditing) {
          setExistingFiles((prev) => ({ ...prev, hdv: { name: file.name, url } }));
          setEditingHdv(false);
        }
      }
    }
  };

  const handleProfessionalCardChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isEditing = editingProCard;
      const url = await handleFileUpload(file, 'professionalCards', isEditing);
      if (url) {
        setProfessionalCardFile(file);
        if (isEditing) {
          setExistingFiles((prev) => ({ ...prev, professionalCard: { name: file.name, url } }));
          setEditingProCard(false);
        }
      }
    }
  };

  const handleCertificateChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setCertificateFiles(files);
    }
  };

  const showInfoPopup = () => {
    Swal.fire({
      title: '¿Por qué me piden estos datos?',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p>Globtherapist requiere validar la autenticidad de los documentos y certificados de los profesionales de salud para garantizar:</p>
          <ul>
            <li>La calidad y seguridad de los servicios ofrecidos</li>
            <li>El cumplimiento de estándares legales y éticos</li>
            <li>La protección de los pacientes y usuarios</li>
            <li>La credibilidad de nuestra plataforma</li>
          </ul>
          <p>Esta verificación es esencial para mantener la confianza en nuestros servicios y cumplir con las regulaciones del sector salud.</p>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#fff',
      width: '88%',
      padding: '20px',
      background: '#2b3e9d',
      color: 'white',
    });
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
      Swal.fire({
        title: 'Subiendo archivos...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // Borrar si hay edición / reemplazo
      await Promise.all([
        profileImageFile && deleteAllFilesInPath('profileImages'),
        hdvFile && deleteAllFilesInPath('hdvFiles'),
        professionalCardFile && deleteAllFilesInPath('professionalCards'),
        (editingCertificates || certificateFiles.length > 0) && deleteAllFilesInPath('certificates'),
      ]);

      let profileUrl = existingFiles.profileImage?.url ?? null;
      let profileFileName = existingFiles.profileImage?.name ?? null;
      if (profileImageFile) {
        profileUrl = await handleFileUpload(profileImageFile, 'profileImages');
        profileFileName = profileImageFile.name;
      }

      let hdvUrl = existingFiles.hdv?.url ?? null;
      let hdvFileName = existingFiles.hdv?.name ?? null;
      if (hdvFile) {
        hdvUrl = await handleFileUpload(hdvFile, 'hdvFiles');
        hdvFileName = hdvFile.name;
      }

      let professionalCardUrl = existingFiles.professionalCard?.url ?? null;
      let professionalCardFileName = existingFiles.professionalCard?.name ?? null;
      if (professionalCardFile) {
        professionalCardUrl = await handleFileUpload(professionalCardFile, 'professionalCards');
        professionalCardFileName = professionalCardFile.name;
      }

      const certificateUrls = await Promise.all(
        certificateFiles.map((file) => handleFileUpload(file, 'certificates')),
      );

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

      const userDocRef = doc(db, 'pros', currentUser.uid);
      await updateDoc(userDocRef, { files: filesData });

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Archivos subidos y datos guardados correctamente',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#041B5E',
        iconColor: '#4ade80',
      });

      // actualizar estado local para que el UI muestre inmediatamente los archivos nuevos
      setExistingFiles({
        profileImage: profileUrl ? { name: profileFileName, url: profileUrl }
          : existingFiles.profileImage,
        hdv: hdvUrl ? { name: hdvFileName, url: hdvUrl } : existingFiles.hdv,
        professionalCard: professionalCardUrl ? {
          name: professionalCardFileName,
          url:
            professionalCardUrl,
        }
          : existingFiles.professionalCard,
        certificates: filesData.certificateFiles || existingFiles.certificates,
      });

      setProfileImageFile(null);
      setHdvFile(null);
      setProfessionalCardFile(null);
      setCertificateFiles([]);
      setEditingCertificates(false);

      if (onFilesUploaded) onFilesUploaded();
    } catch (error) {
      console.error('Error al guardar la información de archivos:', error);
      Swal.close();
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
        <button
          type="button"
          className="question-cont"
          onClick={showInfoPopup}
          aria-label="Información sobre documentos requeridos"
        >
          <h1>?</h1>
        </button>
        <h1>Mis datos</h1>
      </div>
      <div className="data-cont">
        <div className="pro-name-cont">
          <div
            className="user-image-cont"
            onClick={() => !isLoading && document.getElementById('profileImageInput').click()}
          >
            <img src={profileImageUrl} alt="user" className="pro-data-img" />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              style={{ display: 'none' }}
              id="profileImageInput"
              disabled={isLoading}
            />
            {existingFiles.profileImage && !editingProfile ? (
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
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
            <div className="pro-personal-info-data">
              <h3>Email:</h3>
              <p>{currentPro?.email}</p>
            </div>
            <div className="pro-personal-info-data">
              <h3>Teléfono:</h3>
              <p>{currentPro?.telefono}</p>
            </div>
            <div className="pro-personal-info-data">
              <h3>Documento:</h3>
              <p>
                {currentPro?.Documento?.type}
                {' '}
                {currentPro?.Documento?.number}
              </p>
            </div>
          </div>

          <div className="hdv-cont">
            <h2>Hoja de vida:</h2>
            {existingFiles.hdv && !editingHdv ? (
              <div className="file-display">
                <a href={existingFiles.hdv.url} target="_blank" rel="noopener noreferrer" className="file-link">
                  {existingFiles.hdv.name}
                </a>
                <button className="edit-btn" type="button" onClick={() => setEditingHdv(true)} disabled={isLoading}>
                  <img src={edit} alt="" />
                  Editar
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="hdvInput" className="upload-hdv">
                  <img src={Upload} alt="" />
                  <h3>{editingHdv ? 'Reemplazar HDV' : 'Subir HDV'}</h3>
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
          </div>

          <div className="pro-professional-card">
            <h2>Tarjeta profesional:</h2>
            {existingFiles.professionalCard && !editingProCard ? (
              <div className="file-display">
                <a href={existingFiles.professionalCard.url} target="_blank" rel="noopener noreferrer" className="file-link">
                  {existingFiles.professionalCard.name}
                </a>
                <button className="edit-btn" type="button" onClick={() => setEditingProCard(true)} disabled={isLoading}>
                  <img src={edit} alt="" />
                  Editar
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="proCardInput" className="upload-hdv">
                  <img src={Upload} alt="" />
                  <h3>{editingProCard ? 'Reemplazar tarjeta' : 'Subir tarjeta profesional'}</h3>
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
          </div>

          <div className="pro-certificates-cont">
            <h2>Certificados: </h2>
            {existingFiles.certificates.length > 0 && !editingCertificates ? (
              <div className="certificates-list">
                {existingFiles.certificates.map((cert) => (
                  <div key={cert.url} className="pro-certificate">
                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="file-link-cert">{cert.name}</a>
                  </div>
                ))}
                <button className="edit-btn-certificates" type="button" onClick={handleEditCertificates} disabled={isLoading}>
                  <img src={edit} alt="" />
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
              <div key={file.name} className="pro-certificate">{file.name}</div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`save-btn ${isLoading ? 'loading' : ''}`}
        >
          {isLoading ? <div className="spinner" /> : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};

ProData.propTypes = { onFilesUploaded: PropTypes.func };
ProData.defaultProps = { onFilesUploaded: null };

export default ProData;
