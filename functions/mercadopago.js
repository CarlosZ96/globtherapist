const functions = require('firebase-functions');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const cors = require('cors');

const corsHandler = cors({ origin: true });

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-2400667744553776-031717-f3674df0979637213ae96babb278b9e9-313341255',
});

const payment = new Payment(client);

exports.createPayment = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const {
        therapyType, amount, paymentMethodId, payerData,
      } = req.body;
      const paymentData = {
        transaction_amount: amount,
        description: `${therapyType} Terapia`,
        payment_method_id: paymentMethodId,
        payer: {
          email: payerData.email,
          identification: {
            type: payerData.docType,
            number: payerData.docNumber,
          },
          entity_type: 'individual',
        },
        ...(paymentMethodId === 'pse' && {
          transaction_details: {
            financial_institution: payerData.bank,
          },
        }),
        additional_info: {
          ip_address: req.ip || '127.0.0.1',
        },
      };

      const result = await payment.create({ body: paymentData });

      res.status(200).json({
        redirect_url: result.transaction_details?.external_resource_url || null,
        status: result.status,
      });
    } catch (error) {
      console.error('Error MercadoPago:', error);
      res.status(500).json({
        error: error.message,
        raw: error,
      });
    }
  });
});
