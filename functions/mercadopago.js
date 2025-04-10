const functions = require('firebase-functions');
const { MercadoPagoConfig, Payments } = require('mercadopago');
const cors = require('cors');

const corsHandler = cors({ origin: true });

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-2400667744553776-031717-f3674df0979637213ae96babb278b9e9-313341255',
});

const payments = new Payments(client);

exports.createPayment = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { therapyType, amount, ...formData } = req.body;

      const paymentData = {
        transaction_amount: amount,
        description: `${therapyType} Terapia`,
        payment_method_id: formData.payment_method_id,
        payer: {
          email: formData.payer.email,
          identification: formData.payer.identification,
        },
        ...(formData.payment_method_id === 'pse' && {
          transaction_details: {
            financial_institution: formData.financial_institution,
          },
        }),
        ...(formData.token && { token: formData.token }),
        installments: formData.installments || 1,
      };

      const response = await payments.create({ body: paymentData });

      if (response.transaction_details?.external_resource_url) {
        res.json({ redirect_url: response.transaction_details.external_resource_url });
      } else {
        res.json({ status: response.status });
      }
    } catch (error) {
      console.error('Error MercadoPago:', error);
      res.status(500).json({ error: error.message });
    }
  });
});
