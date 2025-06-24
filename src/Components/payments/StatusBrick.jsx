/* eslint-disable consistent-return */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../stylesheets/StatusBrick.css';

const StatusBrick = ({ paymentDetails, onClose }) => {
  const publicKey = process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY;
  useEffect(() => {
    if (!paymentDetails || !paymentDetails.id) return;

    const initializeBrick = () => {
      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-CO',
      });

      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: {
          paymentId: paymentDetails.id, // Usar el ID del pago recibido
        },
        customization: {
          visual: {
            hideStatusDetails: true,
            hideTransactionDate: true,
            style: {
              theme: 'default',
            },
          },
          backUrls: {
            error: 'https://globtherapist.vercel.app/error',
            return: 'https://globtherapist.vercel.app/success',
          },
        },
        callbacks: {
          onReady: () => {
            console.log('Status Screen Brick listo');
          },
          onError: (error) => {
            console.error('Error en Status Screen Brick:', error);
            onClose();
          },
        },
      };

      bricksBuilder.create('statusScreen', 'statusScreenBrick_container', settings)
        .then((controller) => {
          window.statusScreenBrickController = controller;
        });
    };

    const loadMercadoPago = async () => {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = initializeBrick;
      document.body.appendChild(script);
    };

    loadMercadoPago();

    return () => {
      if (window.statusScreenBrickController) {
        window.statusScreenBrickController.unmount();
      }
    };
  }, [paymentDetails, onClose]);

  return (
    <div className="status-brick-overlay">
      <div className="status-brick-container">
        <button
          type="button"
          className="close-button"
          onClick={onClose}
        >
          ✕
        </button>
        <div id="statusScreenBrick_container" style={{ width: '100%' }} />
      </div>
    </div>
  );
};

StatusBrick.propTypes = {
  paymentDetails: PropTypes.shape({
    id: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    method: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default StatusBrick;
