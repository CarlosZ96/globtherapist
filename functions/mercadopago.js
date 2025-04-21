/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const cors = require('cors')({ origin: true });

const client = new MercadoPagoConfig({
  accessToken: functions.config().mp.access_token,
});

const payment = new Payment(client);
const paymentMethodClient = new PaymentMethod(client);

exports.getPaymentMethods = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const methods = await paymentMethodClient.get();
      const pseMethod = methods.find((m) => m.id === 'pse');

      if (!pseMethod) throw new Error('Método PSE no encontrado');

      res.status(200).json({
        banks: pseMethod.financial_institutions.map((b) => ({
          id: String(b.id).padStart(4, '0'),
          name: b.description,
        })),
        minAmount: pseMethod.min_allowed_amount,
        maxAmount: pseMethod.max_allowed_amount,
      });
    } catch (error) {
      functions.logger.error('Error en getPaymentMethods:', error);
      res.status(500).json({
        error: 'Error obteniendo métodos de pago',
        details: error.message,
      });
    }
  });
});

const getValidBanks = async () => {
  try {
    const methods = await paymentMethodClient.get();
    const pseMethod = methods.find((m) => m.id === 'pse');
    return pseMethod?.financial_institutions?.map((b) => String(b.id).padStart(4, '0')) || [];
  } catch (error) {
    functions.logger.error('Error obteniendo bancos:', error);
    return [];
  }
};

exports.createPayment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Validación de campos requeridos
      const requiredFields = [
        'therapyType', 'amount', 'paymentMethodId',
        'payerData.email', 'payerData.docType', 'payerData.docNumber',
      ];

      const missingFields = requiredFields.filter((field) => {
        const parts = field.split('.');
        return !parts.reduce((obj, part) => obj?.[part], req.body);
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Campos faltantes: ${missingFields.join(', ')}`,
          code: 'MISSING_FIELDS',
        });
      }

      // Construcción del payload
      const paymentData = {
        transaction_amount: Number(req.body.amount),
        description: `Terapia ${req.body.therapyType}`,
        payment_method_id: 'pse', // Forzar PSE para pruebas
        payer: {
          email: req.body.payerData.email,
          entity_type: req.body.payerData.entityType, // Campo requerido en raíz
          identification: {
            type: req.body.payerData.docType,
            number: String(req.body.payerData.docNumber).replace(/\D/g, ''),
          },
        },
        transaction_details: {
          financial_institution: String(req.body.payerData.bank).padStart(4, '0'),
        },
        additional_info: {
          ip_address: req.headers['x-forwarded-for'] || '127.0.0.1',
        },
        callback_url: 'https://globtherapist.vercel.app/',
        processing_mode: 'aggregator',
      };

      if (req.body.paymentMethodId === 'pse') {
        const validBanks = await getValidBanks();
        const bank = paymentData.transaction_details.financial_institution;

        if (!validBanks.includes(bank)) {
          return res.status(400).json({
            error: `Banco no válido: ${bank}`,
            code: 'INVALID_BANK',
            validBanks,
          });
        }
      }
      console.log('→ callback_url enviado:', paymentData.callback_url);
      const result = await payment.create({
        body: paymentData,
        requestOptions: { idempotencyKey: crypto.randomUUID() },
      });

      res.status(200).json({
        id: result.id,
        status: result.status,
        redirect_url: result.transaction_details?.external_resource_url,
      });
    } catch (error) {
      functions.logger.error('Error detallado:', {
        errorData: error.response?.data,
        requestBody: req.body,
      });

      const errorMessage = error.response?.data?.cause?.[0]?.description
        || error.message;

      res.status(500).json({
        error: 'Error procesando el pago',
        code: error.response?.data?.error || 'MP_ERROR',
        message: errorMessage,
      });
    }
  });
});
