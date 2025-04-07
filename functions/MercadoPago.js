/* eslint-disable no-unused-vars */
const functions = require('firebase-functions');
const mercadopago = require('mercadopago');

mercadopago.configure({
  access_token: functions.config().mercadopago.token,
});

exports.createPreference = functions.https.onCall(async (data, context) => {
  try {
    const { title, price, quantity } = data;

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
    return { id: response.body.id }; // ID que usas en el frontend para redirigir al checkout
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', 'Error al crear preferencia');
  }
});
