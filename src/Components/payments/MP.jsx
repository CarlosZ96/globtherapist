import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import Swal from 'sweetalert2';
import '../../stylesheets/MP.css';

const MP = ({ therapyType, onPaymentSuccess }) => {
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  useEffect(() => {
    const initializeMP = async () => {
      try {
        await initMercadoPago('TEST-91f4cd81-8588-4208-bfad-d68460c6c42b', {
          locale: 'es-CO',
          advancedFraudPrevention: true,
        });

        setPrice(therapyPrices[therapyType.toLowerCase()]);
        setSdkReady(true);
      } catch (error) {
        console.error('Error inicializando SDK:', error);
        Swal.fire('Error', 'Error al cargar la pasarela de pago', 'error');
      }
    };
    initializeMP();
  }, [therapyType]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      console.log('Datos del Brick:', JSON.stringify(formData, null, 2));

      // Extraer datos de la estructura del Brick
      const brickData = formData.formData || formData;
      const paymentMethodId = brickData.payment_method_id;
      const { payer } = brickData;
      const transactionDetails = brickData.transaction_details;

      // Validaciones mejoradas
      if (!payer?.email) throw new Error('El email es requerido');
      if (!payer.identification?.number) throw new Error('Número de documento es requerido');

      const payload = {
        therapyType: therapyType.toLowerCase(),
        amount: price,
        paymentMethodId,
        payerData: {
          email: payer.email,
          docType: payer.identification.type || 'CC',
          docNumber: String(payer.identification.number).replace(/\D/g, ''),
          ...(paymentMethodId === 'pse' && {
            bank: transactionDetails?.financial_institution,
          }),
        },
      };

      console.log('Payload al backend:', JSON.stringify(payload, null, 2));

      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/createPayment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la transacción');
      }

      const result = await response.json();

      if (result.redirect_url) {
        onPaymentSuccess();
        window.location.href = result.redirect_url;
      } else {
        Swal.fire('Éxito', 'Pago procesado correctamente', 'success');
      }
    } catch (error) {
      Swal.fire('Error', error.message.split(':')[0], 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!sdkReady) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Cargando pasarela de pago...</p>
      </div>
    );
  }

  return (
    <div className="payment-container">
      {loading && (
        <div className="processing-overlay">
          <div className="processing-spinner" />
          <p>Procesando tu pago...</p>
        </div>
      )}

      <Payment
        initialization={{
          amount: price,
          payer: {
            email: '', // Campo obligatorio vacío
          },
        }}
        customization={{
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            bankTransfer: ['pse'], // Solo PSE
            maxInstallments: 1,
          },
          visual: {
            style: {
              theme: 'bootstrap',
              customVariables: {
                formBackgroundColor: '#ffffff',
                baseColor: '#007bff',
              },
            },
          },
        }}
        onSubmit={handleSubmit}
        onError={(error) => {
          console.error('Error en Brick:', error);
          Swal.fire('Error', error.message, 'error');
        }}
      />
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional']).isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
};

export default MP;
