const functions = require('firebase-functions');
const mercadopago = require('mercadopago');
const cors = require('cors')({ origin: true });

mercadopago.configure({
  access_token: functions.config().mercadopago.token,
});

exports.createPreference = functions.https.onRequest((req, res) => {
  // Aplica el middleware CORS
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    try {
      const { title, price, quantity } = req.body;

      const preference = {
        items: [
          {
            title,
            unit_price: Number(price),
            quantity: Number(quantity),
          },
        ],
        back_urls: {
          success: 'https://tuapp.com/success',
          failure: 'https://tuapp.com/failure',
          pending: 'https://tuapp.com/pending',
        },
        auto_return: 'approved',
      };

      const response = await mercadopago.preferences.create(preference);
      return res.status(200).json({ id: response.body.id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al crear preferencia' });
    }
  });
});
