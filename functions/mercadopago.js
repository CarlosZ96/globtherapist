const mercadopago = require('mercadopago');
const functions = require('firebase-functions');

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

exports.createPSEPayment = functions.https.onRequest(async (req, res) => {
  try {
    const {
      amount, therapyType, email, docType, docNumber,
    } = req.body;

    const paymentData = {
      transaction_amount: amount,
      description: `${therapyType} Terapia`,
      payment_method_id: 'pse',
      payer: {
        email,
        identification: {
          type: docType,
          number: docNumber,
        },
      },
      additional_info: {
        ip_address: req.ip,
      },
      transaction_details: {
        financial_institution: '1022',
      },
      callback_url: 'https://globtherapist.vercel.app/confirmacion',
    };

    const response = await mercadopago.payment.create(paymentData);
    res.json({
      redirect_url: response.body.transaction_details.external_resource_url,
    });
  } catch (error) {
    console.error('Error en MercadoPago:', error);
    res.status(500).json({ error: error.message });
  }
});
