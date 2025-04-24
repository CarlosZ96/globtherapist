/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const cors = require('cors')({ origin: true });

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-2400667744553776-031717-f3674df0979637213ae96babb278b9e9-313341255',
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

exports.createPayment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { body } = req;
      const isPSE = body.paymentMethodId === 'pse';

      // Construcción dinámica del payload
      const basePaymentData = {
        transaction_amount: Number(body.amount),
        description: `Terapia ${body.therapyType}`,
        payment_method_id: body.paymentMethodId,
        payer: {
          email: body.payerData.email,
          identification: {
            type: body.payerData.docType,
            number: String(body.payerData.docNumber).replace(/\D/g, ''),
          },
        },
        additional_info: {
          ip_address: req.headers['x-forwarded-for'] || '127.0.0.1',
        },
      };

      // Campos específicos para PSE
      if (isPSE) {
        basePaymentData.payer.entity_type = body.pseData.entityType;
        basePaymentData.transaction_details = {
          financial_institution: body.pseData.bank,
        };
        basePaymentData.callback_url = 'https://globtherapist.vercel.app/';
      }

      // Campos específicos para tarjetas
      if (!isPSE) {
        basePaymentData.token = body.cardData.token;
        basePaymentData.installments = Number(body.cardData.installments);
        basePaymentData.issuer_id = body.cardData.issuerId;
      }

      const result = await payment.create({
        body: basePaymentData,
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
