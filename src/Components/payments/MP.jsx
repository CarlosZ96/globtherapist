import React from 'react';
import PropTypes from 'prop-types';

const MP = ({ therapyType }) => {
  // Mapeo de tipos de terapia a precio en COP
  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  const normalizedType = therapyType.toLowerCase();
  const price = therapyPrices[normalizedType];

  // Título para el producto
  const title = `${normalizedType.charAt(0).toUpperCase()
    + normalizedType.slice(1)
  } Terapia`;

  // Función para invocar la función y redirigir al checkout
  const handlePayment = async () => {
    try {
      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/createPreference',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            price,
            quantity: 1,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }

      const data = await response.json();
      const preferenceId = data.id;
      // Redirige al usuario a Mercado Pago
      window.location.href = `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=${preferenceId}`;
    } catch (error) {
      console.error('Error al crear la preferencia:', error);
    }
  };

  return (
    <div>
      <button type="button" onClick={handlePayment}>
        Pagar
        {' '}
        {title}
        {' '}
        -
        {' '}
        {price.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
        })}
      </button>
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.string.isRequired,
};

export default MP;
