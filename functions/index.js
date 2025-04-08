/* eslint-disable consistent-return */
/* eslint-disable global-require */
const { onRequest } = require('firebase-functions/v2/https');
const { logger, setGlobalOptions } = require('firebase-functions/v2');
const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

setGlobalOptions({
  region: 'us-central1',
  memory: '1GB',
  timeoutSeconds: 60,
});

// Configuración Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://globtherapist.vercel.app'],
}));

// ========== Agora ==========
app.get('/', (req, res) => {
  try {
    const { channelId, role, uid } = req.query;
    if (!channelId || !role) throw new Error('Parámetros requeridos');

    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      channelId,
      Number(uid) || 0,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + 3600,
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Mercado Pago ==========
const mpApp = express();
mpApp.use(express.json());
mpApp.use(cors());

// Crear preferencia para el Brick
mpApp.post('/create-preference', async (req, res) => {
  try {
    const { amount, description } = req.body;

    const preference = await new Preference(mpClient).create({
      body: {
        items: [{
          title: description,
          unit_price: Number(amount),
          quantity: 1,
          currency_id: 'COP',
        }],
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' },
            { id: 'atm' },
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'digital_wallet' },
          ],
          default_payment_method_id: 'pse',
        },
        statement_descriptor: 'GlobTherapist',
        binary_mode: true,
      },
    });

    res.json({ id: preference.id });
  } catch (error) {
    logger.error('Error MP Preference:', error);
    res.status(500).json({ error: error.message });
  }
});

// Procesar pago desde el Brick
mpApp.post('/process-payment', async (req, res) => {
  try {
    const payment = await new Payment(mpClient).create({
      body: {
        ...req.body,
        transaction_amount: Number(req.body.transaction_amount),
        payment_method_id: 'pse',
      },
    });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar funciones
exports.createAgoraToken = onRequest(app);
exports.mercadoPago = onRequest(mpApp);
