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
        await initMercadoPago(process.env.REACT_APP_MP_PUBLIC_KEY, {
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
          name: bank.name,
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
      const {
        payment_method_id: paymentMethodId,
        payer,
        token,
        installments,
        issuerId,
        transaction_details: transactionDetails,
      } = brickData;

      if (!paymentMethodId || !payer?.email || !payer?.identification?.number) {
        throw new Error('Datos incompletos del formulario');
      }

      const basePayload = {
        therapyType: therapyType.toLowerCase(),
        amount: price,
        paymentMethodId,
        payerData: {
          email: payer.email.trim(),
          docType: payer.identification.type || 'CC',
          docNumber: String(payer.identification.number).replace(/\D/g, ''),
        },
      };

      let paymentPayload;
      if (paymentMethodId === 'pse') {
        paymentPayload = {
          ...basePayload,
          payerData: {
            ...basePayload.payerData,
            bank: String(transactionDetails?.financial_institution || '').padStart(4, '0'),
            entityType,
          },
        };

        if (paymentPayload.payerData.bank.length !== 4) {
          throw new Error('Código de banco inválido');
        }
        if (!['individual', 'association'].includes(entityType)) {
          throw new Error('Tipo de entidad no válido');
        }
      } else {
        paymentPayload = {
          ...basePayload,
          cardData: {
            token,
            installments: installments || 1,
            issuerId,
          },
        };
      }

      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/createPayment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
          },
          body: JSON.stringify(paymentPayload),
        },
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error en el pago');

      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        onPaymentSuccess();
        Swal.fire('Éxito', 'Pago procesado correctamente', 'success');
      }
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

      {availableBanks.length > 0 && (
        <>
          {availableBanks.some((b) => b.id === 'pse') && (
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
          )}

          <Payment
            initialization={{
              amount: price,
              payer: {
                email: '',
                identification: {
                  type: 'CC',
                  number: '',
                },
              },
            }}
            customization={{
              paymentMethods: {
                bankTransfer: ['pse'],
                creditCard: 'all',
                debitCard: 'all',
                maxInstallments: 3,
              },
              pse: {
                financialInstitutions: availableBanks,
                entityType: {
                  required: true,
                  options: ['individual', 'association'],
                },
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
              await handleSubmit(formData);
            }}
          />
        </>
      )}
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional']).isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
};

export default MP;
