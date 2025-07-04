/* eslint-disable global-require */

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { RtmTokenBuilder } = require('agora-access-token');
const mercadopagoFunctions = require('./mercadopago');

// Configuración CORS global
const allowedOrigins = [
  'http://localhost:3000',
  'https://globtherapist.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Middleware CORS para todas las rutas
const globalCors = cors(corsOptions);

// Configurar Express para createAgoraToken
const appToken = express();
appToken.use(globalCors);
appToken.get('/', (req, res) => {
  const { channelId, role, uid } = req.query;

  if (!channelId || !role) {
    return res.status(400).json({ error: 'channelId y role son requeridos' });
  }

  const numericUid = Number(uid) || 0;
  const expireTime = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTime;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      channelId,
      numericUid,
      RtcRole.PUBLISHER,
      privilegeExpireTime,
    );
    return res.json({ token });
  } catch (error) {
    console.error('Error generating RTC token:', error);
    return res.status(500).json({ error: error.toString() });
  }
});

// Configurar Express para createAgoraChatToken
const appChatToken = express();
appChatToken.use(globalCors);
appChatToken.get('/', async (req, res) => {
  try {
    const { userId, channelId } = req.query;

    if (!userId || !channelId) {
      return res.status(400).json({
        error: 'userId y channelId son requeridos',
      });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({
        error: 'Configuración de Agora no encontrada',
      });
    }

    const expireTime = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expireTime;

    const token = RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      userId,
      privilegeExpireTime,
    );

    return res.json({
      token,
      appId,
      userId,
      channelId,
      expireTime: privilegeExpireTime,
    });
  } catch (error) {
    console.error('Error generando token RTM:', error);
    return res.status(500).json({
      error: error.message || 'Error generando token',
    });
  }
});

exports.createAgoraToken = functions.https.onRequest(appToken);
exports.createAgoraChatToken = functions.https.onRequest(appChatToken);

exports.createPayment = mercadopagoFunctions.createPayment;
exports.getPaymentMethods = mercadopagoFunctions.getPaymentMethods;
exports.mpWebhook = mercadopagoFunctions.mpWebhook;
