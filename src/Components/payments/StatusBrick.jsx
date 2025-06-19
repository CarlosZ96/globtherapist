import React from 'react';
import PropTypes from 'prop-types';
import '../../stylesheets/StatusBrick.css';

const StatusBrick = ({ paymentDetails, onClose }) => {
  if (!paymentDetails) return null;

  return (
    <div className="status-brick-overlay">
      <div className="status-brick-container">
        <div className="status-header">
          <h2>¡Pago Exitoso!</h2>
          <div className="status-icon success">✓</div>
        </div>

        <div className="payment-details">
          <div className="detail-row">
            <span className="detail-label">ID de transacción:</span>
            <span className="detail-value">{paymentDetails.id}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Método de pago:</span>
            <span className="detail-value">
              {paymentDetails.method === 'pse' ? 'PSE' : 'Tarjeta'}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Monto pagado:</span>
            <span className="detail-value">
              $
              {paymentDetails.amount.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Estado:</span>
            <span className="detail-value status-approved">
              {paymentDetails.status === 'approved' ? 'Aprobado' : 'Pendiente'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="confirm-button"
          onClick={onClose}
        >
          Confirmar y cerrar
        </button>
      </div>
    </div>
  );
};
StatusBrick.propTypes = {
  paymentDetails: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    method: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default StatusBrick;
