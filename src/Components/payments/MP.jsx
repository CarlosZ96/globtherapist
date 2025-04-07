import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MP = ({ therapyType }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const normalizedType = therapyType.toLowerCase();
      const price = therapyPrices[normalizedType];

      if (!price) throw new Error('Tipo de terapia no válido');

      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/createPreference',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `${therapyType} Terapia`,
            price,
            quantity: 1,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el servidor');
      }

      const { id: preferenceId } = await response.json();
      window.location.href = `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=${preferenceId}`;
    } catch (errorr) {
      console.error('Error:', errorr);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const normalizedType = therapyType.toLowerCase();
  const price = therapyPrices[normalizedType];

  return (
    <div className="payment-container">
      {error && <div className="error-message">{error}</div>}

      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? 'Procesando...' : `Pagar ${therapyType} Terapia - ${price.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        })}`}
      </button>
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional']).isRequired,
};

export default MP;
