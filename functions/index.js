/* eslint-disable global-require */
process.env.NODE_OPTIONS = '--no-warnings';
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const chatToken = require('./chatToken');

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN || functions.config().mercadopago?.token,
  sandbox: process.env.NODE_ENV !== 'production',
});

console.log('MP Token:', process.env.MP_ACCESS_TOKEN || functions.config().mercadopago?.token ? 'OK' : 'NO CONFIGURADO');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://globtherapist.vercel.app',
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.get('/', (req, res) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  const { channelId, role, uid } = req.query;

  if (!channelId || !role) {
    return res.status(400).json({ error: 'channelId y role son requeridos' });
  }

  const numericUid = Number(uid) || 0;
  const expireTime = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTime;

  const agoraRole = RtcRole.PUBLISHER;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      channelId,
      numericUid,
      agoraRole,
      privilegeExpireTime,
    );
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating RTC token:', error);
    return res.status(500).json({ error: error.toString() });
  }
});

exports.createAgoraChatToken = chatToken.createAgoraChatToken;
exports.createAgoraToken = functions.https.onRequest(app);
exports.createPreference = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    try {
      const { title, price, quantity } = req.body;

      const preference = {
        items: [{
          title: title.substring(0, 255),
          unit_price: Number(price),
          quantity: Number(quantity),
          currency_id: 'COP',
        }],
        back_urls: {
          success: process.env.MP_SUCCESS_URL,
          failure: process.env.MP_FAILURE_URL,
          pending: process.env.MP_PENDING_URL,
        },
        auto_return: 'approved',
      };

      const response = await mercadopago.preferences.create(preference);
      return res.status(200).json({ id: response.body.id });
    } catch (error) {
      console.error('Error al crear preferencia:', error);
      return res.status(500).json({ error: 'Error al crear preferencia' });
    }
  });
});
