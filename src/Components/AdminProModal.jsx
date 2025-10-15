/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getSuccessEmailHtml } from './mails/emailTemplate';
import '../stylesheets/AdminProModal.css';

const AdminProModal = ({
  show,
  onClose,
  proData,
  onReject,
  onApprove,
}) => {
  if (!show || !proData) return null;
  const {
    Nombre = 'Sin nombre',
    email = 'Sin correo',
    telefono = 'Sin teléfono',
    Documento = {},
    Hdv = {},
    files = {},
    docId,
  } = proData;

  const { number: docNumber = '', type: docType = '' } = Documento;
  const {
    profession = '',
    yearsOfExperience = '',
    university = '',
    professionalHistory = '',
  } = Hdv;
  const {
    hdvUrl = '',
    professionalCardUrl = '',
    certificateFiles = [],
  } = files;

  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');
  // Estado para las terapias activas (botones) que inician vacías
  const [selectedTherapies, setSelectedTherapies] = useState([]);

  // Función para normalizar el texto (elimina tildes y pasa a minúsculas)
  const normalizeText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  };

  // helper: obtener nombre de terapia desde item que puede ser string u objeto
  const getNameFromItem = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    // si es objeto, intenta propiedades comunes
    if (item.name) return item.name;
    if (item.Nombre) return item.Nombre;
    if (item.terapia) return item.terapia;
    return '';
  };

  // helper: obtener precio desde item (si existe)
  const getPriceFromItem = (item) => {
    if (!item || typeof item === 'string') return null;
    if (item.price !== undefined && item.price !== null) return Number(item.price);
    if (item.precio !== undefined && item.precio !== null) return Number(item.precio);
    return null;
  };

  // Función para activar o desactivar una terapia al hacer click
  const handleTherapyClick = (therapy) => {
    const normalizedTherapy = normalizeText(therapy);
    const exists = selectedTherapies.some(
      (t) => normalizeText(t) === normalizedTherapy,
    );
    if (exists) {
      // Remueve la terapia del array
      setSelectedTherapies((prev) => prev.filter(
        (t) => normalizeText(t) !== normalizedTherapy,
      ));
    } else {
      // Agrega la terapia
      setSelectedTherapies((prev) => [...prev, therapy]);
    }
  };

  const handleApprove = async () => {
    try {
      // Normaliza las terapias activas seleccionadas por el admin
      const activeTherapiesNormalized = selectedTherapies
        .map((therapy) => normalizeText(therapy))
        .filter(Boolean);

      // Traer terapias actuales del pro (pueden ser strings o objetos)
      const currentTherapies = Array.isArray(proData.terapias) ? proData.terapias : [];

      // Determinar formato actual: si existe al menos un objeto, consideramos esquema de objetos
      const currentHasObjects = currentTherapies.some((it) => typeof it === 'object' && it !== null);

      // Normalizar nombres actuales para comparación
      // eslint-disable-next-line no-unused-vars
      const currentNamesNormalized = currentTherapies.map(
        (it) => normalizeText(getNameFromItem(it)),
      );

      // Construir updatedTherapies manteniendo formato
      let updatedTherapies;
      if (currentHasObjects) {
        // Empieza con los objetos actuales que están en la lista activa (preservando price)
        updatedTherapies = currentTherapies
          .filter((it) => {
            const nm = normalizeText(getNameFromItem(it));
            return activeTherapiesNormalized.includes(nm);
          })
          .map((it) => {
            // asegurarnos de que el campo name esté normalizado (mantener price)
            const nameRaw = getNameFromItem(it);
            const normalized = normalizeText(nameRaw);
            return {
              ...it,
              name: normalized,
              price: getPriceFromItem(it) ?? 0,
            };
          });

        // Añadir las terapias seleccionadas que no estaban en current
        activeTherapiesNormalized.forEach((normName) => {
          const already = updatedTherapies.some(
            (it) => normalizeText(getNameFromItem(it)) === normName,
          );
          if (!already) {
            updatedTherapies.push({ name: normName, price: 0 });
          }
        });
      } else {
        // current es array de strings (legacy) -> guardamos strings normalizados
        // empezamos con los strings actuales que estén activos
        updatedTherapies = currentTherapies
          .map((s) => normalizeText(getNameFromItem(s)))
          .filter((nm) => activeTherapiesNormalized.includes(nm));

        // añadir activos que no estén ya
        activeTherapiesNormalized.forEach((nm) => {
          if (!updatedTherapies.includes(nm)) {
            updatedTherapies.push(nm);
          }
        });
      }

      // Actualizar documento en Firestore
      const proRef = doc(db, 'pros', docId);
      await updateDoc(proRef, {
        status: 'aprobado',
        terapias: updatedTherapies,
      });

      console.log('Status actualizado a aprobado');

      // Preparar y enviar correo (enviamos nombres normalizados)
      const emailContent = getSuccessEmailHtml(activeTherapiesNormalized);
      await setDoc(doc(db, 'mail', docId), {
        to: email,
        message: {
          subject: '¡Tu cuenta ha sido aprobada!',
          html: emailContent,
        },
      });

      console.log('Correo de aprobación enviado a:', email);
      if (typeof onApprove === 'function') onApprove();
      if (typeof onClose === 'function') onClose();
    } catch (error) {
      console.error('Error al aprobar:', error);
    }
  };

  const handleRejectClick = () => {
    if (!showReason) {
      setShowReason(true);
    } else if (reason.trim() === '') {
      alert('Por favor, ingresa el motivo del rechazo.');
    } else if (onReject) {
      onReject(reason); // Pasar la razón al método onReject
    }
  };

  // Array fijo de terapias
  const therapies = ['Lenguaje', 'Física', 'Mental', 'Ocupacional'];

  return (
    <div className="adminProModal-overlay">
      <div className="adminProModal-content">
        <button
          type="button"
          className="adminProModal-close"
          onClick={onClose}
        >
          X
        </button>

        <h2 className="adminProModal-title">{Nombre}</h2>

        <div className="adminProModal-row">
          <label>Correo:</label>
          <span>{email}</span>
        </div>

        <div className="adminProModal-row">
          <label>Teléfono:</label>
          <span>{telefono}</span>
        </div>

        <div className="adminProModal-row">
          <label>Profesional en:</label>
          <span>{profession}</span>
        </div>

        <div className="adminProModal-row">
          <label>Años de experiencia:</label>
          <span>{yearsOfExperience}</span>
        </div>

        <div className="adminProModal-row">
          <label>Egresado/a en:</label>
          <span>{university}</span>
        </div>

        <div className="adminProModal-row-textarea">
          <label>Historial profesional:</label>
          <textarea readOnly value={professionalHistory} />
        </div>

        <div className="adminProModal-row">
          <label>Documento:</label>
          <span>{docNumber}</span>
        </div>

        <div className="adminProModal-row">
          <label>Tipo de Documento:</label>
          <span>{docType}</span>
        </div>

        <div className="adminProModal-row">
          <label>Hoja de Vida:</label>
          {hdvUrl ? (
            <a href={hdvUrl} target="_blank" rel="noreferrer">
              Ver / Descargar
            </a>
          ) : (
            <span>No disponible</span>
          )}
        </div>

        <div className="adminProModal-row">
          <label>Tarjeta profesional:</label>
          {professionalCardUrl ? (
            <a href={professionalCardUrl} target="_blank" rel="noreferrer">
              Ver / Descargar
            </a>
          ) : (
            <span>No disponible</span>
          )}
        </div>

        <div className="adminProModal-therapies">
          {therapies.map((therapy, index) => {
            const isActive = selectedTherapies.some(
              (t) => normalizeText(t) === normalizeText(therapy),
            );
            return (
              <div
                key={index}
                onClick={() => handleTherapyClick(therapy)}
                className={isActive ? 'proModal-terapie-act' : 'proModal-terapie'}
                style={{ cursor: 'pointer' }}
              >
                {therapy}
              </div>
            );
          })}
        </div>

        <div className="adminProModal-row-certificates">
          <label>Certificaciones:</label>
          <div className="adminProModal-cert-list">
            {Array.isArray(certificateFiles) && certificateFiles.length > 0 ? (
              certificateFiles.map((cert) => (
                <a
                  key={cert.url}
                  href={cert.url}
                  target="_blank"
                  rel="noreferrer"
                  className="adminProModal-cert-item"
                >
                  {cert.fileName}
                </a>
              ))
            ) : (
              <span>No hay certificados</span>
            )}
          </div>
        </div>

        <div
          className="adminProModal-reason"
          style={{
            display: showReason ? 'block' : 'none',
            border: showReason ? '2px solid #EA3E3E' : 'none',
            padding: showReason ? '5px' : '0',
          }}
        >
          <h4>Motivo del rechazo:</h4>
          <textarea
            name="reason"
            id="reason"
            placeholder="Detalla el motivo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="adminProModal-buttons">
          <button
            type="button"
            className="reject-btn"
            onClick={handleRejectClick}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="approve-btn"
            onClick={handleApprove}
          >
            Aprobar
          </button>
        </div>
      </div>
    </div>
  );
};

AdminProModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  proData: PropTypes.shape({
    Nombre: PropTypes.string,
    email: PropTypes.string,
    telefono: PropTypes.string,
    Documento: PropTypes.shape({
      number: PropTypes.string,
      type: PropTypes.string,
    }),
    Hdv: PropTypes.shape({
      profession: PropTypes.string,
      yearsOfExperience: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      university: PropTypes.string,
      professionalHistory: PropTypes.string,
    }),
    files: PropTypes.shape({
      hdvUrl: PropTypes.string,
      professionalCardUrl: PropTypes.string,
      certificateFiles: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string,
          fileName: PropTypes.string,
        }),
      ),
    }),
    docId: PropTypes.string,
    // terapias puede ser array de strings (legacy) o array de objetos { name, price }
    terapias: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
  }).isRequired,
  onReject: PropTypes.func,
};

AdminProModal.defaultProps = {
  onReject: null,
};

export default AdminProModal;
