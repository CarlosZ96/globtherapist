import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Payment, initMercadoPago } from '@mercadopago/sdk-react';

// Inicializa el SDK con tu clave pública
initMercadoPago('TU_PUBLIC_KEY'); // Reemplaza 'TU_PUBLIC_KEY' con la tuya

const MP = ({ therapyType }) => {
  const [preferenceId, setPreferenceId] = useState(null);
  const [price, setPrice] = useState(0);

  // Lista de precios para cada tipo de terapia
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
          'https://us-central1-globtherapist.cloudfunctions.net/api/mercadoPago/create-preference',
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

  // Función que se ejecuta cuando se presiona el botón dentro del Payment Brick
  const handleSubmit = async ({ formData }) => {
    try {
      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/api/mercadoPago/process-payment',
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
        // Redirige o muestra mensaje de éxito
        console.log('Pago aprobado', result);
      } else {
        console.warn('Pago no aprobado', result);
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
          // Actualización en la personalización del Brick para incluir PSE
          customization={{
            paymentMethods: {
              // Se activa bankTransfer para que aparezca PSE
              bankTransfer: 'all',
              // Activa cualquier método que requiera preferencia
              // (por ejemplo, PSE puede venir dentro de 'mercadoPago')
              mercadoPago: 'all',
              // Si deseas excluir otros métodos:
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
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional'])
    .isRequired,
};

export default MP;
