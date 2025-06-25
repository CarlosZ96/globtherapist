/* eslint-disable consistent-return */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import '../../stylesheets/StatusBrick.css';

const StatusBrick = ({ paymentDetails, onClose, onRetry }) => {
  const publicKey = process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY;
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [brickLoaded, setBrickLoaded] = useState(false);

  // Función para verificar el estado del pago directamente desde la API
  const checkPaymentStatus = async (paymentId) => {
    try {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_MERCADOPAGO_ACCESS_TOKEN}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Error al obtener estado del pago');
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error verificando estado:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!paymentDetails || !paymentDetails.id) return;

    // Verificar el estado del pago cada 5 segundos
    const statusInterval = setInterval(async () => {
      const status = await checkPaymentStatus(paymentDetails.id);
      if (status) {
        console.log(`Estado del pago: ${status}`);
        setPaymentStatus(status);

        if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(status)) {
          setShowRetryButton(true);
        }
      }
    }, 5000);

    return () => clearInterval(statusInterval);
  }, [paymentDetails]);

  useEffect(() => {
    if (!paymentDetails || !paymentDetails.id || brickLoaded) return;

    const initializeBrick = () => {
      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-CO',
      });

      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: {
          paymentId: paymentDetails.id,
        },
        customization: {
          visual: {
            hideStatusDetails: true,
            hideTransactionDate: true,
            style: {
              theme: 'default',
              textPrimaryColor: '#fff',
              formBackgroundColor: '#2B3E9D',
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
            setBrickLoaded(true);
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
        })
        .catch((error) => {
          console.error('Error al crear el brick:', error);
        });
    };

    const loadMercadoPago = async () => {
      if (window.MercadoPago) {
        initializeBrick();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = initializeBrick;
      script.onerror = () => {
        console.error('Error al cargar el SDK de MercadoPago');
        Swal.fire('Error', 'No se pudo cargar la pasarela de pago', 'error');
      };
      document.body.appendChild(script);
    };

    loadMercadoPago();

    return () => {
      if (window.statusScreenBrickController) {
        window.statusScreenBrickController.unmount();
      }
    };
  }, [paymentDetails, onClose, publicKey, brickLoaded]);

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

        {showRetryButton && (
          <div className="retry-button-container">
            <button
              type="button"
              className="retry-button"
              onClick={onRetry}
            >
              Reintentar pago
            </button>
          </div>
        )}
        {paymentStatus && (
          <div className="debug-info">
            <p>
              Estado actual:
              {' '}
              {paymentStatus}
            </p>
          </div>
        )}
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
  onRetry: PropTypes.func.isRequired,
};

export default StatusBrick;
