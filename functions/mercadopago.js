/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const cors = require('cors')({ origin: true });

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const paymentClient = new Payment(client);
const paymentMethodClient = new PaymentMethod(client);

const allowedOrigins = [
  'http://localhost:3000',
  'https://globtherapist.vercel.app',
  'https://www.globtherapist.vercel.app',
];

const validateOrigin = (origin) => allowedOrigins.some((allowed) => origin?.startsWith(allowed));

exports.getPaymentMethods = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (!validateOrigin(req.get('origin'))) {
        return res.status(403).json({ error: 'Origen no permitido' });
      }

      const { results } = await paymentMethodClient.list();
      const pseMethod = results.find((m) => m.id === 'pse');

      if (!pseMethod) throw new Error('Método PSE no encontrado');

      res.status(200).json({
        banks: pseMethod.financial_institutions.map((b) => ({
          id: b.id.toString(),
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
        code: error.code || 'MP_API_ERROR',
      });
    }
  });
});

exports.createPayment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (!validateOrigin(req.get('origin'))) {
        return res.status(403).json({ error: 'Origen no permitido' });
      }

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

      const paymentData = {
        transaction_amount: Number(req.body.amount),
        description: `Terapia ${req.body.therapyType}`,
        payment_method_id: req.body.paymentMethodId,
        payer: {
          email: req.body.payerData.email,
          identification: {
            type: req.body.payerData.docType,
            number: String(req.body.payerData.docNumber).replace(/\D/g, ''),
          },
          ...(req.body.paymentMethodId === 'pse' && {
            entity_type: req.body.payerData.entityType,
          }),
        },
        ...(req.body.paymentMethodId === 'pse' && {
          transaction_details: {
            financial_institution: req.body.payerData.bank,
          },
        }),
        additional_info: {
          ip_address: req.headers['x-forwarded-for'] || req.ip,
        },
        callback_url: 'https://globtherapist.vercel.app/payment-callback',
        processing_mode: 'aggregator',
      };

      const result = await paymentClient.create({
        body: paymentData,
        requestOptions: { idempotencyKey: crypto.randomUUID() },
      });

      res.status(200).json({
        id: result.id,
        status: result.status,
        redirect_url: result.transaction_details?.external_resource_url,
      });
    } catch (error) {
      functions.logger.error('Error en createPayment:', {
        error: error.message,
        stack: error.stack,
        responseData: error.response?.data,
      });

      const errorDetails = error.response?.data?.cause?.[0]?.description
        || error.response?.data?.message
        || error.message;

      res.status(500).json({
        error: 'Error procesando el pago',
        code: error.response?.data?.error || 'MP_API_ERROR',
        details: errorDetails,
      });
    }
  });
});
