import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initMercadoPago, Payment, StatusScreen } from '@mercadopago/sdk-react';
import Swal from 'sweetalert2';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../stylesheets/MP.css';

const MP = ({
  therapyType,
  onPaymentSuccess,
  currentUser,
  selectedPro,
  citaGlobal,
  formData,
}) => {
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableBanks, setAvailableBanks] = useState([]);
  const [paymentId, setPaymentId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const therapyPrices = {
    mental: 80000,
    fisica: 70000,
    lenguaje: 55000,
    ocupacional: 41000,
  };

  useEffect(() => {
    const paymentIdParam = searchParams.get('payment_id');
    if (paymentIdParam) {
      setPaymentId(paymentIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkPaymentStatus = () => {
      if (paymentId) {
        Swal.fire({
          title: 'Procesando pago...',
          text: 'Estamos verificando el estado de tu transacción',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
      }
    };
    checkPaymentStatus();
  }, [paymentId]);

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

  const validateMetadata = () => {
    if (!currentUser?.uid) throw new Error('Usuario no autenticado');
    if (!selectedPro) throw new Error('Profesional no seleccionado');
    if (!citaGlobal?.date || !citaGlobal?.time) throw new Error('Cita incompleta');
    if (!formData?.name || !formData?.email) throw new Error('Datos de usuario incompletos');
  };

  const handleSubmit = async (rawFormData) => {
    setLoading(true);
    try {
      validateMetadata();

      const { formData: brickData } = rawFormData;
      const {
        payment_method_id: paymentMethodId,
        transaction_details: transactionDetails,
        payer,
      } = brickData;

      if (!payer || typeof payer !== 'object') {
        throw new Error('Datos del pagador no están disponibles');
      }

      const metadata = {
        citaData: {
          userId: currentUser.uid,
          proId: selectedPro,
          date: citaGlobal.date,
          month: citaGlobal.month,
          time: citaGlobal.time,
          therapyType: therapyType.toLowerCase(),
          userName: formData.name,
          userEmail: formData.email,
          userPhone: formData.phone,
          description: formData.description,
        },
      };

      const payload = {
        therapyType: therapyType.toLowerCase(),
        amount: price,
        paymentMethodId,
        metadata,
        payerData: {
          email: payer.email?.trim() || formData.email,
          docType: payer.identification?.type || 'CC',
          docNumber: String(payer.identification?.number || '').replace(/\D/g, ''),
        },
      };

      if (paymentMethodId === 'pse') {
        payload.pseData = {
          bank: String(transactionDetails?.financial_institution || '').padStart(4, '0'),
          entityType: payer.entity_type || 'individual',
        };

        if (!payload.pseData.bank || payload.pseData.bank.length !== 4) {
          throw new Error('Banco inválido: Selecciona un banco válido');
        }
      } else {
        payload.cardData = {
          token: brickData.token,
          installments: brickData.installments || 1,
          issuerId: brickData.issuer_id?.toString() || '',
        };

        if (!payload.cardData.token) {
          throw new Error('Tarjeta inválida: Verifica los datos de la tarjeta');
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
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Error al procesar el pago');

      if (result.redirect_url) {
        setPaymentId(result.id);
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

      {paymentId ? (
        <StatusScreen
          initialization={{ paymentId }}
          customization={{
            visual: {
              style: {
                theme: 'dark',
                customVariables: {
                  formBackgroundColor: '#212B42',
                  baseColor: '#4F63C2',
                },
              },
            },
          }}
          onReady={() => Swal.close()}
          onError={(error) => {
            console.error('Error en Status Screen:', error);
            Swal.fire('Error', 'Hubo un problema mostrando el estado del pago', 'error');
          }}
        />
      ) : (
        availableBanks.length > 0 && (
          <Payment
            initialization={{
              amount: price,
              payer: {
                email: formData?.email || '',
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
            onSubmit={async (brickFormData) => {
              await handleSubmit(brickFormData);
            }}
          />
        )
      )}
    </div>
  );
};

MP.propTypes = {
  therapyType: PropTypes.oneOf(['Mental', 'Fisica', 'Lenguaje', 'Ocupacional']).isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    uid: PropTypes.string,
  }),
  selectedPro: PropTypes.string,
  citaGlobal: PropTypes.shape({
    date: PropTypes.string,
    month: PropTypes.string,
    time: PropTypes.string,
  }),
  formData: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    description: PropTypes.string,
  }),
};

MP.defaultProps = {
  currentUser: null,
  selectedPro: '',
  citaGlobal: {},
  formData: {},
};

export default MP;
