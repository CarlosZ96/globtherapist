/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import PropTypes from 'prop-types';
import '../stylesheets/AdminProModal.css';

const AdminProModal = ({
  show,
  onClose,
  proData,
  onApprove,
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

  const handleApprove = () => {
    if (onApprove) onApprove();
  };
  const handleReject = () => {
    if (onReject) onReject();
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
            <a href={hdvUrl} target="_blank" rel="noreferrer">Ver / Descargar</a>
          ) : (
            <span>No disponible</span>
          )}
        </div>

        <div className="adminProModal-row">
          <label>Tarjeta profesional:</label>
          {professionalCardUrl ? (
            <a href={professionalCardUrl} target="_blank" rel="noreferrer">Ver / Descargar</a>
          ) : (
            <span>No disponible</span>
          )}
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

        <div className="adminProModal-reason">
          <h4>Motifo del rechazo:</h4>
          <textarea name="reason" id="reason" placeholder="Detalla el motivo.." />
        </div>

        <div className="adminProModal-buttons">
          <button
            type="button"
            className="reject-btn"
            onClick={handleReject}
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
      yearsOfExperience: PropTypes.string,
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
  }).isRequired,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
};

AdminProModal.defaultProps = {
  onApprove: null,
  onReject: null,
};

export default AdminProModal;
