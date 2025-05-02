/* eslint-disable consistent-return */
/* eslint-disable global-require */
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Configuración general CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://globtherapist.vercel.app',
];

functions.config({
  timeoutSeconds: 120,
  memory: '1GB',
});

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado por CORS'));
  },
  optionsSuccessStatus: 200,
};

// Configuración para Agora Token
const agoraApp = express();
agoraApp.use(cors(corsOptions));
agoraApp.options('*', cors(corsOptions));

agoraApp.get('/health', (req, res) => res.status(200).json({ status: 'Agora API Ready' }));

agoraApp.get('/generate-token', (req, res) => {
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
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating RTC token:', error);
    res.status(500).json({ error: error.toString() });
  }
});

exports.createAgoraToken = functions.https.onRequest(agoraApp);
exports.createAgoraChatToken = require('./chatToken').createAgoraChatToken;
exports.mercadopago = require('./mercadopago').handler;
