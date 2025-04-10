import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

initMercadoPago('TEST-91f4cd81-8588-4208-bfad-d68460c6c42b', {
  locale: 'es-CO',
});

const MP = ({ therapyType }) => {
  const [price, setPrice] = useState(0);

  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  useEffect(() => {
    const normalizedType = therapyType.toLowerCase();
    setPrice(therapyPrices[normalizedType]);
  }, [therapyType]);

  const customization = {
    paymentMethods: {
      creditCard: 'all',
      debitCard: 'all',
      bankTransfer: 'all',
      maxInstallments: 1,
    },
  };

  const handleSubmit = async (formData) => {
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

      const result = await response.json();
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
    }
  };

  return (
    <div className="payment-container">
      <Payment
        initialization={{ amount: price }}
        customization={customization}
        onSubmit={handleSubmit}
        onError={(error) => console.error(error)}
      />
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional'])
    .isRequired,
};

export default MP;
