/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const cors = require('cors')({ origin: true });

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 15000 },
});

const payment = new Payment(client);
const paymentMethodClient = new PaymentMethod(client);

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

      const basePaymentData = {
        transaction_amount: Number(req.body.amount),
        description: `Terapia ${req.body.therapyType}`,
        payment_method_id: req.body.paymentMethodId,
        payer: {
          email: req.body.payerData.email,
          identification: {
            type: req.body.payerData.docType,
            number: String(req.body.payerData.docNumber).replace(/\D/g, ''),
          },
        },
        additional_info: {
          ip_address: req.headers['x-forwarded-for'] || '127.0.0.1',
        },
        processing_mode: 'aggregator',
      };

      if (req.body.paymentMethodId === 'pse') {
        basePaymentData.payer.entity_type = req.body.payerData.entityType;
        basePaymentData.transaction_details = {
          financial_institution: String(req.body.payerData.bank).padStart(4, '0'),
        };
        basePaymentData.callback_url = 'https://tu-dominio.com/callback';

        const validBanks = await getValidBanks();
        const bank = basePaymentData.transaction_details.financial_institution;
        if (!validBanks.includes(bank)) {
          return res.status(400).json({
            error: `Banco no válido: ${bank}`,
            code: 'INVALID_BANK',
          });
        }
      } else {
        if (!req.body.cardData?.token) {
          return res.status(400).json({
            error: 'Token de tarjeta requerido',
            code: 'MISSING_CARD_TOKEN',
          });
        }

        basePaymentData.token = req.body.cardData.token;
        basePaymentData.installments = Number(req.body.cardData.installments) || 1;
        basePaymentData.issuer_id = req.body.cardData.issuerId;
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

      const errorMessage = error.response?.data?.cause?.[0]?.description || error.message;
      const errorCode = error.response?.data?.error || 'MP_ERROR';

      res.status(error.response?.status || 500).json({
        error: 'Error procesando el pago',
        code: errorCode,
        message: errorMessage,
      });
    }
  });
});

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
