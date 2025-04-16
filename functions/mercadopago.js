/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const cors = require('cors')({ origin: true });

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-2400667744553776-031717-f3674df0979637213ae96babb278b9e9-313341255',
});

const payment = new Payment(client);
const paymentMethodClient = new PaymentMethod(client);

// Helper para obtener bancos válidos con manejo de errores
const getValidBanks = async () => {
  try {
    const methods = await paymentMethodClient.get();
    const pseMethod = methods.find((m) => m.id === 'pse');
    return pseMethod?.financial_institutions?.map((b) => b.id) || [];
  } catch (error) {
    functions.logger.error('Error obteniendo bancos:', error);
    return [];
  }
};

exports.getPaymentMethods = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const methods = await paymentMethodClient.get();
      const pseMethod = methods.find((m) => m.id === 'pse');

      if (!pseMethod) throw new Error('Método PSE no encontrado');

      res.status(200).json({
        banks: pseMethod.financial_institutions,
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

exports.createPayment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Validación mejorada
      const requiredFields = [
        'therapyType',
        'amount',
        'paymentMethodId',
        'payerData.email',
        'payerData.docType',
        'payerData.docNumber',
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

      // Validación específica para PSE
      if (req.body.paymentMethodId === 'pse') {
        const validBanks = await getValidBanks();
        const bank = String(req.body.payerData?.bank || '').padStart(4, '0');

        if (!validBanks.includes(bank)) {
          return res.status(400).json({
            error: `Banco no válido: ${bank}`,
            code: 'INVALID_BANK',
            validBanks,
          });
        }

        if (!['individual', 'association'].includes(req.body.payerData?.entityType)) {
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
            ? 'https://tudominio.com/confirmacion'
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
      functions.logger.error('Error en createPayment:', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body,
      });

      const errorData = error.response?.data || {};

      res.status(500).json({
        error: 'Error procesando el pago',
        code: errorData.error || 'MP_ERROR',
        message: errorData.message || error.message,
        ...(errorData.error === 'financial_institution must be a valid value' && {
          validBanks: await getValidBanks(),
        }),
      });
    }
  });
});
