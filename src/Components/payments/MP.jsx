/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import Swal from 'sweetalert2';

// 1. Inicialización correcta del SDK
initMercadoPago('TEST-91f4cd81-8588-4208-bfad-d68460c6c42b', {
  locale: 'es-CO',
  advancedFraudPrevention: true,
  trackingDisabled: false,
});

const MP = ({ therapyType, onPaymentSuccess }) => {
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false); // Nuevo estado

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await initMercadoPago('TEST-91f4cd81-8588-4208-bfad-d68460c6c42b', {
          locale: 'es-CO',
          advancedFraudPrevention: true,
        });
        setSdkReady(true);
      } catch (error) {
        console.error('Error inicializando MercadoPago:', error);
        Swal.fire('Error', 'No se pudo cargar el sistema de pagos', 'error');
      }
    };

    initializeSDK();
  }, []);
  // 2. Mapeo de precios válido
  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  useEffect(() => {
    if (sdkReady) {
      const normalizedType = therapyType.toLowerCase();
      setPrice(therapyPrices[normalizedType]);
    }
  }, [therapyType, sdkReady]);
  if (!sdkReady) return <div>Cargando pasarela de pago...</div>;

  // 3. Actualización correcta del precio según terapia
  useEffect(() => {
    const normalizedType = therapyType.toLowerCase();
    setPrice(therapyPrices[normalizedType]);
  }, [therapyType]);

  // 4. Configuración de métodos de pago
  const customization = {
    paymentMethods: {
      creditCard: 'all',
      debitCard: 'all',
      bankTransfer: 'all', // Incluye PSE
      maxInstallments: 1,
    },
  };

  // 5. Manejo de envío de pago
  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        therapyType,
        amount: price,
        paymentMethodId: formData.paymentMethodId,
        payerData: {
          email: formData.payer.email,
          docType: formData.payer.identification.type,
          docNumber: formData.payer.identification.number,
          ...(formData.paymentMethodId === 'pse' && {
            bank: formData.transaction_details.financial_institution,
          }),
        },
      };

      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/createPayment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error desconocido');
      }

      if (result.redirect_url) {
        onPaymentSuccess();
        window.location.href = result.redirect_url;
      } else {
        Swal.fire('Éxito', 'Pago procesado correctamente', 'success');
      }
    } catch (error) {
      Swal.fire('Error', `Error procesando el pago: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="payment-container" style={{ minHeight: '400px', position: 'relative' }}>
      {/* 7. Renderizado correcto del Brick */}
      {loading && <div className="loading-overlay">Cargando métodos de pago...</div>}
      <Payment
        initialization={{ amount: price }}
        customization={customization}
        onSubmit={handleSubmit}
        onError={(error) => console.error(error)}
      />
    </div>
  );
};

// 8. Validación de props
MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional'])
    .isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
};

export default MP;
