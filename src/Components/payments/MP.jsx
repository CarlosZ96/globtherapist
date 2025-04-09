/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initMercadoPago } from '@mercadopago/sdk-react';

initMercadoPago('TEST-91f4cd81-8588-4208-bfad-d68460c6c42b');

const MP = ({ therapyType }) => {
  const [price, setPrice] = useState(0);
  const [email, setEmail] = useState('');
  const [docType, setDocType] = useState('CC');
  const [docNumber, setDocNumber] = useState('');

  // Tipos de documento permitidos para Colombia
  const documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'NIT', label: 'NIT' },
    { value: 'Pasaporte', label: 'Pasaporte' },
  ];

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

  const handlePayment = async () => {
    try {
      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/api/mercadoPago/create-pse-payment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: price,
            therapyType,
            email,
            docType,
            docNumber,
          }),
        },
      );

      const { redirectUrl } = await response.json();
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error al procesar el pago:', error);
    }
  };

  return (
    <div className="payment-container">
      <div className="form-group">
        <label>Correo electrónico:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Tipo de documento:</label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          required
        >
          {documentTypes.map((doc) => (
            <option key={doc.value} value={doc.value}>
              {doc.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Número de documento:</label>
        <input
          type="text"
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value)}
          required
        />
      </div>

      <button type="button" onClick={handlePayment} className="pay-button">
        Pagar
        {' '}
        {price.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        })}
      </button>
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional'])
    .isRequired,
};

export default MP;
