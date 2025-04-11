import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import Swal from 'sweetalert2';

// 1. Inicialización correcta del SDK
initMercadoPago('TEST-91f4cd81-8588-4208-bfad-d68460c6c42b', {
  locale: 'es-CO',
});

const MP = ({ therapyType, onPaymentSuccess }) => {
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  // 2. Mapeo de precios válido
  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

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
      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/createPayment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            therapyType,
            amount: price,
            ...formData,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.error) {
        Swal.fire('Error', result.error, 'error');
        return;
      }
      // 6. Manejo de redirección
      if (result.redirect_url) {
        onPaymentSuccess();
        window.location.href = result.redirect_url;
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
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
