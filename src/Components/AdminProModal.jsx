/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  doc, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getSuccessEmailHtml } from './mails/emailTemplate';
import '../stylesheets/AdminProModal.css';

const AdminProModal = ({
  show,
  onClose,
  proData,
  onReject,
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
  const handleApprove = async () => {
    try {
      const proRef = doc(db, 'pros', docId);
      await updateDoc(proRef, { status: 'aprobado' });
      console.log('Status actualizado a aprobado');
      const terapias = proData.terapias || ['fisica', 'lenguaje', 'mental'];
      const emailContent = getSuccessEmailHtml(terapias);

      await setDoc(doc(db, 'mail', docId), {
        to: email,
        message: {
          subject: '¡Tu cuenta ha sido aprobada!',
          html: emailContent,
        },
      });
      console.log('Correo de aprobación enviado a:', email);

      onClose();
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
      onReject(reason);
    }
  };

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
          <div>Lenguaje</div>
          <div>Física</div>
          <div>Mental</div>
          <div>Ocupacional</div>
        </div>
        <div className="adminProModal-row-certificates">
          <label>Certificaciones:</label>
          <div className="adminProModal-cert-list">
            {certificateFiles.length > 0 ? (
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
    docId: PropTypes.string, // id del documento en Firestore
    terapias: PropTypes.arrayOf(PropTypes.string), // (opcional) arreglo de terapias
  }).isRequired,
  onReject: PropTypes.func,
};

AdminProModal.defaultProps = {
  onReject: null,
};

export default AdminProModal;
