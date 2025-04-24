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
        await initMercadoPago(process.env.REACT_APP_MP_PUBLIC_KEY || 'TEST-91f4cd81-8588-4208-bfad-d68460c6c42b', {
          locale: 'es-CO',
          advancedFraudPrevention: true,
        });

        const banksResponse = await fetch(
          'https://us-central1-globtherapist.cloudfunctions.net/getPaymentMethods',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );

        if (!banksResponse.ok) throw new Error('Error obteniendo bancos');

        const { banks } = await banksResponse.json();
        setAvailableBanks(banks.map((bank) => ({
          id: bank.id,
          name: bank.description,
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
      // 1. Extraer datos del Brick
      const { formData: brickData } = rawFormData;
      const {
        payment_method_id: paymentMethodId,
        token, // Token generado para tarjetas
        issuer_id: issuerId, // Emisor (solo tarjetas)
        installments, // Cuotas (solo tarjetas)
        payer,
        transaction_details: transactionDetails,
      } = brickData;

      // 2. Validaciones comunes
      if (!paymentMethodId || !payer?.email || !payer?.identification?.number) {
        throw new Error('Datos incompletos: Verifica la información del pago');
      }

      // 3. Estructura base del payload
      const payload = {
        therapyType: therapyType.toLowerCase(),
        amount: price,
        paymentMethodId,
        payerData: {
          email: payer.email.trim(),
          docType: payer.identification.type || 'CC',
          docNumber: String(payer.identification.number).replace(/\D/g, ''),
        },
        // Campos específicos para tarjetas
        ...(paymentMethodId !== 'pse' && {
          cardData: {
            token,
            installments: installments || 1,
            issuerId: issuerId?.toString() || '',
          },
        }),
        // Campos específicos para PSE
        ...(paymentMethodId === 'pse' && {
          pseData: {
            bank: String(transactionDetails?.financial_institution || '').padStart(4, '0'),
            entityType,
          },
        }),
      };

      // 4. Validaciones específicas para PSE
      if (paymentMethodId === 'pse') {
        if (!payload.pseData?.bank || payload.pseData.bank.length !== 4) {
          throw new Error('Banco inválido: Selecciona un banco válido');
        }
        if (!['individual', 'association'].includes(entityType)) {
          throw new Error('Tipo de entidad: Selecciona un tipo válido');
        }
      }

      // 5. Validaciones específicas para tarjetas
      if (paymentMethodId !== 'pse') {
        if (!token || typeof token !== 'string') {
          throw new Error('Tarjeta inválida: Verifica los datos de la tarjeta');
        }
        if (!installments || installments < 1) {
          throw new Error('Cuotas inválidas: Selecciona un número válido');
        }
      }

      // 6. Enviar al backend
      const response = await fetch(
        'https://us-central1-globtherapist.cloudfunctions.net/createPayment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el pago');
      }

      // 7. Manejar respuesta
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        onPaymentSuccess();
        Swal.fire({
          icon: 'success',
          title: '¡Pago exitoso!',
          text: 'Tu sesión ha sido agendada correctamente',
          confirmButtonColor: '#4F63C2',
        });
      }
    } catch (error) {
      console.error('Error en el pago:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en el pago',
        html: `<div class="text-left">
          <strong>${error.message.split(':')[0]}</strong><br>
          <small>${error.message.split(':')[1] || 'Intenta nuevamente o usa otro método'}</small>
        </div>`,
        confirmButtonColor: '#FF4B4B',
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
              email: '', // Campo vacío para entrada del usuario
              identification: {
                type: 'CC', // Tipo por defecto
                number: '', // Número vacío para entrada
              },
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
              entityType: {
                required: true,
                options: ['individual', 'association'],
              },
            },
            payer: {
              requiredIdentification: true, // Obligar identificación
              defaultIdentificationType: 'CC', // Tipo por defecto
              identificationTypes: ['CC', 'CE', 'NIT'], // Tipos permitidos
            },
            visual: {
              hidePaymentButton: false, // Asegurar visibilidad del botón
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
            // Verificar estructura completa de los datos
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
