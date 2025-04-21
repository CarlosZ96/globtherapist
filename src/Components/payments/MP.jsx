/* eslint-disable no-unused-expressions */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import Swal from 'sweetalert2';
import '../../stylesheets/MP.css';

const MP = ({ therapyType, onPaymentSuccess }) => {
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableBanks, setAvailableBanks] = useState([]);
  const [entityType, setEntityType] = useState('individual');

  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  useEffect(() => {
    const initializeMP = async () => {
      try {
        await initMercadoPago(process.env.REACT_APP_MP_ACCESS_TOKEN, {
          locale: 'es-CO',
          advancedFraudPrevention: true,
        });

        const banksResponse = await fetch(
          'https://us-central1-globtherapist.cloudfunctions.net/getPaymentMethods',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!banksResponse.ok) throw new Error('Error obteniendo bancos');

        const { banks } = await banksResponse.json();
        setAvailableBanks(banks.map((bank) => ({
          id: bank.id,
          description: bank.description,
        })));

        setPrice(therapyPrices[therapyType.toLowerCase()]);
      } catch (error) {
        console.error('Error inicializando SDK:', error);
        Swal.fire('Error', 'Error al cargar la pasarela de pago', 'error');
      }
    };

    initializeMP();
  }, [therapyType]);

  const handleSubmit = async (rawFormData) => {
    setLoading(true);
    try {
      const { formData: brickData } = rawFormData;
      // eslint-disable-next-line max-len
      const { payment_method_id: paymentMethodId, payer, transaction_details: transactionDetails } = brickData;
      if (!paymentMethodId || !payer?.email || !payer?.identification?.number) {
        throw new Error('Datos incompletos del formulario');
      }

      const psePayload = {
        therapyType: therapyType.toLowerCase(),
        amount: price,
        paymentMethodId: 'pse',
        payerData: {
          email: payer.email.trim(),
          docType: payer.identification.type || 'CC',
          docNumber: String(payer.identification.number).replace(/\D/g, ''),
          bank: String(transactionDetails?.financial_institution), // Eliminado padding
          entityType,
        },
      };

      if (paymentMethodId === 'pse') {
        if (psePayload.payerData.bank.length < 1) {
          throw new Error('Código de banco inválido');
        }
        if (!['individual', 'association'].includes(entityType)) {
          throw new Error('Tipo de entidad no válido');
        }
      }

      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/createPayment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
          },
          body: JSON.stringify(psePayload),
        },
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error en el pago');

      result.redirect_url
        ? (window.location.href = result.redirect_url)
        : (onPaymentSuccess(), Swal.fire('Éxito', 'Pago procesado correctamente', 'success'));
    } catch (error) {
      console.error('Error completo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en el pago',
        html: `<div class="text-left">
          <strong>${error.message.split(':')[0]}</strong><br>
          <small>${error.message.split(':')[1] || ''}</small>
        </div>`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      {loading && (
        <div className="processing-overlay">
          <div className="processing-spinner" />
          <p>Procesando tu pago...</p>
        </div>
      )}

      <div className="entity-type-selector">
        <label>Tipo de entidad:</label>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          disabled={loading}
        >
          <option value="individual">Persona Natural</option>
          <option value="association">Empresa</option>
        </select>
      </div>

      {availableBanks.length > 0 && (
        <Payment
          initialization={{
            amount: price,
            payer: {
              email: '',
              identification: { type: 'CC', number: '' },
            },
          }}
          customization={{
            paymentMethods: {
              bankTransfer: ['pse'],
              creditCard: 'all',
              debitCard: 'all',
              maxInstallments: 1,
            },
            pse: {
              financialInstitutions: availableBanks,
              entityType, // Envío directo del estado
            },
            payer: {
              requiredIdentification: true,
              defaultIdentificationType: 'CC',
              identificationTypes: ['CC', 'CE', 'NIT'],
            },
            visual: {
              hidePaymentButton: false,
              style: {
                theme: 'dark',
                customVariables: {
                  formBackgroundColor: '#212B42',
                  baseColor: '#4F63C2',
                },
              },
            },
          }}
          onSubmit={async (formData) => {
            console.log('Datos del Brick:', formData);
            await handleSubmit(formData);
          }}
        />
      )}
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional']).isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
};

export default MP;
