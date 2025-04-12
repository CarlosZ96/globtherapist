import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import Swal from 'sweetalert2';

const MP = ({ therapyType, onPaymentSuccess }) => {
  // Estados en orden fijo y consistente
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // Objeto de precios (mejor práctica: fuera del cuerpo del componente)
  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  // Único efecto para inicialización y actualización de precio
  useEffect(() => {
    const initializeMP = async () => {
      try {
        // 1. Inicializar SDK
        await initMercadoPago('TEST-91f4cd81-8588-4208-bfad-d68460c6c42b', {
          locale: 'es-CO',
          advancedFraudPrevention: true,
        });

        // 2. Actualizar precio solo después de inicialización exitosa
        const normalizedType = therapyType.toLowerCase();
        setPrice(therapyPrices[normalizedType]);

        // 3. Marcar SDK como listo
        setSdkReady(true);
      } catch (error) {
        console.error('Error inicializando MercadoPago:', error);
        Swal.fire('Error', 'No se pudo cargar el sistema de pagos', 'error');
      }
    };

    initializeMP();
  }, [therapyType]); // Solo terapia como dependencia

  // Configuración de métodos de pago
  const customization = {
    paymentMethods: {
      creditCard: 'all',
      debitCard: 'all',
      bankTransfer: 'all',
      maxInstallments: 1,
    },
    presentation: {
      visual: {
        style: {
          theme: 'dark', // Opciones: 'dark' | 'light' | 'bootstrap'
        },
      },
    },
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const paymentMethodId = formData.payment_method_id || formData.formData?.payment_method_id;
      const payer = formData.payer || formData.formData?.payer;
      // eslint-disable-next-line max-len
      const transactionDetails = formData.transaction_details || formData.formData?.transaction_details;

      if (!payer?.email) {
        throw new Error('El email es requerido');
      }
      const payload = {
        therapyType: therapyType.toLowerCase(),
        amount: price,
        paymentMethodId,
        payerData: {
          email: payer.email,
          docType: payer.identification?.type || 'CC',
          docNumber: String(payer.identification?.number || '').replace(/\D/g, ''),
          ...(paymentMethodId === 'pse' && {
            bank: transactionDetails?.financial_institution,
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
        throw new Error(result.error || 'Error en la transacción');
      }

      if (result.redirect_url) {
        onPaymentSuccess();
        window.location.href = result.redirect_url;
      } else {
        Swal.fire('Éxito', 'Pago procesado correctamente', 'success');
      }
    } catch (error) {
      console.log('Datos del formulario:', JSON.stringify(formData, null, 2));
      Swal.fire('Error', `Error procesando el pago: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Condicional DEBE ir después de todos los hooks
  if (!sdkReady) {
    return (
      <div className="payment-loading">
        <div className="spinner" />
        <p>Cargando pasarela de pago...</p>
      </div>
    );
  }

  return (
    <div className="payment-container" style={{ minHeight: '400px', position: 'relative' }}>
      {loading && (
        <div className="payment-overlay">
          <div className="payment-spinner" />
          <p>Procesando pago...</p>
        </div>
      )}

      <Payment
        initialization={{ amount: price }}
        customization={customization}
        onSubmit={handleSubmit}
        onReady={() => console.log('Brick listo')}
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
