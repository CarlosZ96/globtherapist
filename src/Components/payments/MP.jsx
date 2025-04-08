import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Payment, initMercadoPago } from '@mercadopago/sdk-react';

initMercadoPago('TU_PUBLIC_KEY'); // Reemplaza con tu public key

const MP = ({ therapyType }) => {
  const [preferenceId, setPreferenceId] = useState(null);
  const [price, setPrice] = useState(0);

  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  useEffect(() => {
    const createPreference = async () => {
      const normalizedType = therapyType.toLowerCase();
      const amount = therapyPrices[normalizedType];
      setPrice(amount);

      try {
        const response = await fetch(
          'https://us-central1-globtherapist.cloudfunctions.net/mercadoPago/create-preference',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              description: `${therapyType} Terapia`,
            }),
          },
        );

        const { id } = await response.json();
        setPreferenceId(id);
      } catch (error) {
        console.error('Error creating preference:', error);
      }
    };

    createPreference();
  }, [therapyType]);

  const handleSubmit = async ({ formData }) => {
    try {
      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/mercadoPago/process-payment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            transaction_amount: price,
            description: `${therapyType} Terapia`,
          }),
        },
      );

      const result = await response.json();
      if (result.status === 'approved') {
        // Redirigir a página de éxito
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <div className="payment-container">
      {preferenceId && (
        <Payment
          initialization={{ amount: price, preferenceId }}
          customization={{
            paymentMethods: {
              bankTransfer: 'all', // Habilita PSE
              creditCard: 'excluded',
              debitCard: 'excluded',
              ticket: 'excluded',
            },
          }}
          onSubmit={handleSubmit}
          onError={(error) => console.error('Brick error:', error)}
          onReady={() => console.log('Brick ready')}
        />
      )}

      <div className="price-display">
        {price.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        })}
      </div>
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional']).isRequired,
};

export default MP;
