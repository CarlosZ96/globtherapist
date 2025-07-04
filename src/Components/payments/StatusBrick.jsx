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
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Referencias para controlar la instancia del brick y funciones de callback
  const brickControllerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Verificar estado del pago
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

      if (!response.ok) throw new Error('Error al obtener estado del pago');
      return await response.json();
    } catch (error) {
      console.error('Error verificando estado:', error);
      return null;
    }
  };

  // Cargar SDK de MercadoPago
  useEffect(() => {
    if (window.MercadoPago) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => {
      console.error('Error al cargar el SDK de MercadoPago');
      Swal.fire('Error', 'No se pudo cargar la pasarela de pago', 'error');
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Verificar estado del pago periódicamente
  useEffect(() => {
    if (!paymentDetails?.id) return;

    const fetchPaymentInfo = async () => {
      const info = await checkPaymentStatus(paymentDetails.id);
      if (!info) return;

      setPaymentStatus(info.status);
      setShowRetryButton(['rejected', 'cancelled', 'refunded', 'charged_back'].includes(info.status));
    };

    fetchPaymentInfo();
    const statusInterval = setInterval(fetchPaymentInfo, 5000);
    return () => clearInterval(statusInterval);
  }, [paymentDetails]);

  // Inicializar el brick cuando el SDK y los detalles estén listos
  useEffect(() => {
    if (!sdkLoaded || !paymentDetails?.id) return;
    setLoading(true);

    // Limpiar instancia previa
    if (brickControllerRef.current) {
      brickControllerRef.current.unmount();
      brickControllerRef.current = null;
    }

    const mp = new window.MercadoPago(publicKey, { locale: 'es-CO' });
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
          setLoading(false);
        },
        onError: (error) => {
          console.error('Error en Status Screen Brick:', error);
          onCloseRef.current();
          setLoading(false);
        },
      },
    };

    bricksBuilder.create('statusScreen', 'statusScreenBrick_container', settings)
      .then((controller) => {
        brickControllerRef.current = controller;
      })
      .catch((error) => {
        console.error('Error al crear el brick:', error);
        setLoading(false);
      });

    return () => {
      if (brickControllerRef.current) {
        brickControllerRef.current.unmount();
        brickControllerRef.current = null;
      }
    };
  }, [sdkLoaded, paymentDetails, publicKey]);

  return (
    <div className="status-brick-overlay">
      <div className="status-brick-container">
        <button type="button" className="close-button" onClick={onClose}>
          ✕
        </button>

        <div
          id="statusScreenBrick_container"
          style={{
 width: '100%', minHeight: '300px', position: 'relative', zIndex: 10,
}}
        />

        {!loading && showRetryButton && (
          <div className="retry-button-container">
            <button type="button" className="retry-button" onClick={onRetry}>
              Reintentar pago
            </button>
          </div>
        )}

        {loading && (
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
