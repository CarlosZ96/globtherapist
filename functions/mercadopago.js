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
      // Validación de campos requeridos
      const requiredFields = ['therapyType', 'amount', 'paymentMethodId', 'payerData'];
      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Campos faltantes: ${missingFields.join(', ')}`,
          code: 'MISSING_FIELDS',
        });
      }

      // Validación de monto
      const expectedPrices = {
        mental: 80000,
        fisica: 70000,
        lenguaje: 55000,
        ocupacional: 41000,
      };

      const therapyType = req.body.therapyType.toLowerCase();

      if (req.body.amount !== expectedPrices[therapyType]) {
        return res.status(400).json({
          error: `Monto inválido para ${therapyType}. Esperado: $${expectedPrices[therapyType]}`,
          code: 'INVALID_AMOUNT',
        });
      }

      // Construcción de datos del pago
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

      // Configuración adicional para PSE
      if (req.body.paymentMethodId === 'pse') {
        if (!req.body.payerData.bank) {
          return res.status(400).json({
            error: 'Banco requerido para pagos PSE',
            code: 'MISSING_BANK',
          });
        }

        paymentData.payer.entity_type = 'individual';
        paymentData.transaction_details = {
          financial_institution: req.body.payerData.bank,
        };
        paymentData.callback_url = 'https://tu-dominio.com/confirmacion-pago';
      }

      const result = await payment.create({ body: paymentData });

      return res.status(200).json({
        id: result.id,
        status: result.status,
        payment_method: result.payment_method_id,
        redirect_url: result.transaction_details?.external_resource_url,
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
      });
    } catch (error) {
      console.error('Error en procesamiento de pago:', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body,
      });

      return res.status(500).json({
        error: 'Error interno procesando el pago',
        code: error.code || 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  });
});
