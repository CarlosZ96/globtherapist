/* eslint-disable global-require */
// index.js (Firebase Functions para tokens de Agora RTC y Agora Chat)

// Cargar dotenv solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const {
  RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole,
} = require('agora-access-token');

const app = express();

// Lista de orígenes permitidos
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

// Endpoint para generar token de videollamada (RTC)
app.get('/', (req, res) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  const { channelId, role, uid } = req.query;
  const numericUid = Number(uid) || 0;
  const expireTime = 3600; // 1 hora
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTime;

  if (!channelId || !role) {
    return res.status(400).json({ error: 'channelId y role son requeridos' });
  }

  const agoraRole = role === 'uidHost' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

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
    console.error('Error generating token:', error);
    return res.status(500).json({ error: error.toString() });
  }
});

// Endpoint para generar token de Agora Chat (RTM)
app.get('/createAgoraChatToken', (req, res) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId es requerido' });
  }
  const expireTime = 3600; // 1 hora
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTime;
  try {
    const token = RtmTokenBuilder.buildToken(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      userId,
      RtmRole.USER,
      privilegeExpireTime,
    );
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating chat token:', error);
    return res.status(500).json({ error: error.toString() });
  }
});

exports.createAgoraToken = functions.https.onRequest(app);
