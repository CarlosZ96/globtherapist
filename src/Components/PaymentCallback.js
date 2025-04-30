/* eslint-disable react/jsx-filename-extension */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentCallback = ({ onPaymentSuccess }) => {
  const [paymentId, setPaymentId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeStatusBrick = async () => {
      const mp = new window.MercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, {
        locale: 'es-CO',
      });

      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: { paymentId },
        customization: {
          visual: {
            hidePaymentButton: true,
            style: { theme: 'dark' },
          },
        },
        callbacks: {
          onReady: () => console.log('Status Screen Brick listo'),
          onError: () => {
            Swal.fire('Error', 'Error al verificar el pago', 'error');
            navigate('/');
          },
        },
      };

      await bricksBuilder.create('statusScreen', 'statusBrick_container', settings);
    };

    if (paymentId) initializeStatusBrick();
  }, [paymentId, navigate]);

  const checkPaymentStatus = async (paymentsId) => {
    try {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentsId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_MERCADOPAGO_ACCESS_TOKEN}`,
          },
        },
      );

      const paymentInfo = await response.json();

      if (paymentInfo.status === 'approved') {
        onPaymentSuccess();
        Swal.fire({
          title: '¡Pago exitoso!',
          text: 'Redirigiendo a la página principal...',
          icon: 'success',
          timer: 3000,
          willClose: () => navigate('/'),
        });
      }
    } catch (error) {
      console.error('Error verificando estado del pago:', error);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentIdParam = urlParams.get('payment_id');

    if (paymentIdParam) {
      setPaymentId(paymentIdParam);
      checkPaymentStatus(paymentIdParam);
    }
  }, [location]);

  return (
    <div className="payment-callback-container">
      <div id="statusBrick_container" style={{ maxWidth: '600px', margin: '2rem auto' }} />
    </div>
  );
};
PaymentCallback.propTypes = {
  onPaymentSuccess: PropTypes.func.isRequired,
};

export default PaymentCallback;
