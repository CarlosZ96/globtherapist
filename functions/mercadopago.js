/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const cors = require('cors')({ origin: true });

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-2400667744553776-031717-f3674df0979637213ae96babb278b9e9-313341255',
});

const payment = new Payment(client);
const paymentMethod = new PaymentMethod(client);

const getValidBanks = async () => {
  try {
    const methods = await paymentMethod.get();
    const pseMethod = methods.find((m) => m.id === 'pse');
    return pseMethod?.financial_institutions?.map((b) => b.id) || [];
  } catch (error) {
    console.error('Error obteniendo bancos:', error);
    return [];
  }
};

exports.getPaymentMethods = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const methods = await paymentMethod.get();
      const pseMethod = methods.find((m) => m.id === 'pse');

      res.status(200).json({
        banks: pseMethod?.financial_institutions || [],
        minAmount: pseMethod?.min_allowed_amount || 0,
        maxAmount: pseMethod?.max_allowed_amount || 0,
      });
    } catch (error) {
      console.error('Error obteniendo métodos:', error);
      res.status(500).json({
        error: 'Error obteniendo métodos de pago',
        details: error.message,
      });
    }
  });
});

exports.createPayment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const requiredFields = [
        'therapyType',
        'amount',
        'paymentMethodId',
        'payerData.email',
        'payerData.docType',
        'payerData.docNumber',
      ];

      // Validación de campos requeridos
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

      // Validación específica para PSE
      if (req.body.paymentMethodId === 'pse') {
        const validBanks = await getValidBanks();

        if (!validBanks.includes(req.body.payerData.bank)) {
          return res.status(400).json({
            error: 'Banco no válido',
            code: 'INVALID_BANK',
            validBanks,
          });
        }

        if (!['individual', 'association'].includes(req.body.payerData.entityType)) {
          return res.status(400).json({
            error: 'Tipo de entidad inválido',
            code: 'INVALID_ENTITY_TYPE',
          });
        }
      }

      // Construcción del pago
      const paymentData = {
        transaction_amount: Number(req.body.amount),
        description: `${req.body.therapyType} Terapia`,
        payment_method_id: req.body.paymentMethodId,
        payer: {
          email: req.body.payerData.email,
          identification: {
            type: req.body.payerData.docType,
            number: String(req.body.payerData.docNumber).replace(/\D/g, ''),
          },
        },
        ...(req.body.paymentMethodId === 'pse' && {
          processing_mode: 'aggregator',
          transaction_details: {
            financial_institution: String(req.body.payerData.bank).padStart(4, '0'),
          },
          payer: {
            entity_type: req.body.payerData.entityType,
          },
          callback_url: process.env.NODE_ENV === 'production'
            ? 'https://globtherapist.vercel.app/'
            : 'https://localhost:3000/confirmacion',
        }),
      };

      // Crear pago en MP
      const result = await payment.create({ body: paymentData });

      res.status(200).json({
        id: result.id,
        status: result.status,
        redirect_url: result.transaction_details?.external_resource_url,
      });
    } catch (error) {
      console.error('Error en MP:', {
        request: req.body,
        error: error.response?.data || error.message,
        stack: error.stack,
      });

      const errorResponse = {
        error: 'Error procesando el pago',
        code: error.response?.status || 'MP_ERROR',
        message: error.message,
      };

      if (error.response?.data?.error === 'financial_institution must be a valid value') {
        errorResponse.validBanks = await getValidBanks();
      }

      res.status(500).json(errorResponse);
    }
  });
});
