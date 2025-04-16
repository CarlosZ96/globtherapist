/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
const functions = require('firebase-functions');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const cors = require('cors');

const corsMiddleware = cors({ origin: true });
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-2400667744553776-031717-f3674df0979637213ae96babb278b9e9-313341255',
});
const payment = new Payment(client);

exports.createPayment = functions.https.onRequest((req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      // Validación de campos
      const requiredFields = [
        'therapyType',
        'amount',
        'paymentMethodId',
        'payerData.email',
        'payerData.docType',
        'payerData.docNumber',
        ...(req.body.paymentMethodId === 'pse' ? ['payerData.entityType'] : []),
      ];

      const missingFields = requiredFields.filter((field) => {
        const parts = field.split('.');
        let value = req.body;
        for (const part of parts) {
          value = value?.[part];
          if (value === undefined) break;
        }
        return value === undefined;
      });

      if (req.body.paymentMethodId === 'pse') {
        if (!['individual', 'association'].includes(req.body.payerData.entityType)) {
          return res.status(400).json({
            error: 'entityType debe ser "individual" o "association"',
            code: 'INVALID_ENTITY_TYPE',
          });
        }
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Campos faltantes: ${missingFields.join(', ')}`,
          code: 'MISSING_FIELDS',
        });
      }

      if (req.body.paymentMethodId !== 'pse' && !req.body.token) {
        return res.status(400).json({
          error: 'Token requerido para pagos con tarjeta',
          code: 'MISSING_TOKEN',
        });
      }

      // Validación de monto
      const therapyType = req.body.therapyType.toLowerCase();
      const expectedPrices = {
        mental: 80000,
        fisica: 70000,
        lenguaje: 55000,
        ocupacional: 41000,
      };

      if (req.body.amount !== expectedPrices[therapyType]) {
        return res.status(400).json({
          error: `Monto inválido para ${therapyType}: $${expectedPrices[therapyType]} requerido`,
          code: 'INVALID_AMOUNT',
        });
      }

      const paymentData = {
        transaction_amount: req.body.amount,
        description: `${therapyType} Terapia`,
        payer: {
          email: req.body.payerData.email,
          identification: {
            type: req.body.payerData.docType,
            number: String(req.body.payerData.docNumber).replace(/\D/g, ''),
          },
        },
        additional_info: {
          ip_address: req.ip || '127.0.0.1',
        },
        ...(req.body.paymentMethodId === 'pse' ? {
          payment_method_id: 'pse',
          processing_mode: 'aggregator',
          payer: {
            entity_type: req.body.payerData.entityType,
          },
          transaction_details: {
            financial_institution: req.body.payerData.bank,
          },
          callback_url: 'https://tu-dominio.com/confirmacion',
        } : {
          token: req.body.token,
          installments: Number(req.body.installments) || 1,
          issuer_id: req.body.issuer_id,
        }),
      };

      // Crear pago en Mercado Pago
      const result = await payment.create({ body: paymentData });

      // Respuesta exitosa
      res.status(200).json({
        id: result.id,
        status: result.status,
        payment_method_id: result.payment_method_id,
        redirect_url: result.transaction_details?.external_resource_url,
      });
    } catch (error) {
      console.error('Error detallado:', {
        code: error?.cause?.code,
        status: error?.cause?.status,
        message: error?.cause?.message,
        requestId: error?.cause?.headers?.['x-request-id'],
        stack: error.stack,
      });

      res.status(500).json({
        error: 'Error procesando el pago',
        code: error?.cause?.code || 'MP_ERROR',
        details: error.message,
      });
    }
  });
});
