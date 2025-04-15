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
      // Validación mejorada de campos
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
        let value = req.body;
        for (const part of parts) {
          value = value?.[part];
          if (value === undefined) break;
        }
        return value === undefined;
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Campos faltantes: ${missingFields.join(', ')}`,
          code: 'MISSING_FIELDS',
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

      // Construcción del pago
      const paymentData = {
        transaction_amount: req.body.amount,
        description: `${therapyType} Terapia`,
        payment_method_id: req.body.paymentMethodId,
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
      };

      // Configuración específica para PSE
      if (req.body.paymentMethodId === 'pse') {
        if (!req.body.payerData?.bank) {
          return res.status(400).json({
            error: 'Código de banco requerido para PSE',
            code: 'MISSING_BANK',
          });
        }
        paymentData.payer.entity_type = 'individual';
        paymentData.transaction_details = {
          financial_institution: req.body.payerData.bank,
        };
        paymentData.callback_url = 'http://localhost:3000/confirmacion';
      }

      // Crear pago en Mercado Pago
      const result = await payment.create({ body: paymentData });

      // Respuesta exitosa
      return res.status(200).json({
        id: result.id,
        status: result.status,
        payment_method: result.payment_method_id,
        redirect_url: result.transaction_details?.external_resource_url,
      });
    } catch (error) {
      console.error('Error en el proceso de pago:', {
        message: error.message,
        stack: error.stack,
        requestBody: req.body,
      });

      return res.status(500).json({
        error: 'Error procesando el pago',
        code: error.code || 'MP_ERROR',
        details: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  });
});
