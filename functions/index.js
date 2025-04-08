/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable global-require */
const functions = require('firebase-functions');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Configuración inicial
process.env.NODE_OPTIONS = '--no-warnings';
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Inicializar Express y CORS
const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'https://globtherapist.vercel.app',
];

// Configurar CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Configurar Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || functions.config().mercadopago?.token,
  options: {
    sandbox: process.env.NODE_ENV !== 'production',
    timeout: 5000,
  },
});

const preferenceClient = new Preference(mpClient);

// Ruta para tokens de Agora
app.get('/agora-token', (req, res) => {
  const { channelId, role, uid } = req.query;

  if (!channelId || !role) {
    return res.status(400).json({ error: 'Se requieren channelId y role' });
  }

  try {
    const numericUid = Number(uid) || 0;
    const expireTime = 3600;
    const privilegeExpireTime = Math.floor(Date.now() / 1000) + expireTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      channelId,
      numericUid,
      RtcRole.PUBLISHER,
      privilegeExpireTime,
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generando token Agora:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para crear preferencias de pago
app.post('/create-preference', async (req, res) => {
  try {
    const { title, price, quantity } = req.body;

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const preference = await preferenceClient.create({
      body: {
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
      },
    });

    res.status(200).json({ id: preference.id });
  } catch (error) {
    console.error('Error Mercado Pago:', error);
    res.status(500).json({
      error: 'Error al crear el pago',
      details: error.message,
    });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: err.message });
});

// Exportar funciones Firebase
exports.api = functions.https.onRequest(app);

// Opcional: Suprimir advertencias de punycode
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) return;
  console.warn(warning.name, warning.message);
});
