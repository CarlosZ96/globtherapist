/* eslint-disable no-unused-vars */
/* eslint-disable no-nested-ternary */
/* eslint-disable consistent-return */
import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import '../../stylesheets/StatusBrick.css';

const StatusBrick = ({ paymentDetails, onClose, onRetry }) => {
  const publicKey = process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY;
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [brickLoaded, setBrickLoaded] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const brickContainerRef = useRef(null);

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
      return data;
    } catch (error) {
      console.error('Error verificando estado:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!paymentDetails || !paymentDetails.id) return;

    // Obtener y mostrar información completa del pago
    const fetchPaymentInfo = async () => {
      const info = await checkPaymentStatus(paymentDetails.id);
      if (info) {
        setPaymentInfo(info);
        setPaymentStatus(info.status);

        if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(info.status)) {
          setShowRetryButton(true);
        }
      }
    };

    fetchPaymentInfo();

    // Verificar el estado del pago periódicamente
    const statusInterval = setInterval(fetchPaymentInfo, 5000);
    return () => clearInterval(statusInterval);
  }, [paymentDetails]);

  const initializeBrick = () => {
    if (!window.MercadoPago || brickLoaded) return;

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

    bricksBuilder.create('statusScreen', brickContainerRef.current, settings)
      .then((controller) => {
        window.statusScreenBrickController = controller;
      })
      .catch((error) => {
        console.error('Error al crear el brick:', error);
      });
  };

  useEffect(() => {
    if (!paymentDetails || !paymentDetails.id) return;

    // Verificar si el SDK ya está cargado
    if (sdkLoaded) {
      initializeBrick();
      return;
    }

    const loadMercadoPago = async () => {
      if (window.MercadoPago) {
        setSdkLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        console.log('SDK de MercadoPago cargado');
        setSdkLoaded(true);
      };
      script.onerror = () => {
        console.error('Error al cargar el SDK de MercadoPago');
        Swal.fire('Error', 'No se pudo cargar la pasarela de pago', 'error');
      };
      document.body.appendChild(script);
    };

    loadMercadoPago();
  }, [paymentDetails, sdkLoaded]);

  useEffect(() => {
    if (!sdkLoaded || brickLoaded || !paymentDetails?.id) return;

    initializeBrick();
  }, [sdkLoaded, brickLoaded, paymentDetails]);

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

        {/* Contenedor del Status Screen Brick */}
        <div
          id="statusScreenBrick_container"
          ref={brickContainerRef}
          style={{
            width: '100%',
            minHeight: '300px',
            position: 'relative',
            zIndex: 10,
          }}
        />

        {/* Contenedor para el botón de reintento */}
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

        {/* Indicador de carga si el brick aún no está listo */}
        {!brickLoaded && (
          <div className="loading-indicator">
            <div className="loading-spinner" />
            <p>Cargando detalles del pago...</p>
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
