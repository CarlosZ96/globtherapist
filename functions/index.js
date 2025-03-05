/* eslint-disable global-require */
// index.js (Firebase Functions para tokens de Agora RTC y Agora Chat)

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const {
  RtcTokenBuilder, RtcRole, // para RTC
} = require('agora-access-token');

// Para Agora Chat usamos el paquete agora-token
const { ChatTokenBuilder } = require('agora-token');

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
    console.error('Error generating RTC token:', error);
    return res.status(500).json({ error: error.toString() });
  }
});

// Endpoint para generar token de Agora Chat (RTM)
// Nota: Usamos ChatTokenBuilder.buildAppToken para generar el token de chat,
// siguiendo la documentación que indica
// que se debe pasar el userId junto con el tiempo de expiración.
app.get('/createAgoraChatToken', (req, res) => {
  console.log('[DEBUG] AGORA_CHAT_APP_ID:', process.env.REACT_APP_AGORA_CHAT_APP_KEY);
  console.log(
    '[DEBUG] AGORA_CHAT_APP_CERTIFICATE:',
    `${process.env.agora.chat_app_certificate?.substring(0, 5)}...`,
  );
  console.log('[DEBUG] userId recibido:', req.query.userId);

  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  const { userId } = req.query;
  if (!userId || userId.trim() === '') {
    return res.status(400).json({ error: 'userId es requerido y no puede estar vacío' });
  }

  try {
    const token = ChatTokenBuilder.buildAppToken(
      process.env.REACT_APP_AGORA_CHAT_APP_KEY,
      process.env.AGORA_APP_CERTIFICATE,
      userId,
      3600,
    );
    console.log('[DEBUG] Token generado:', `${token?.substring(0, 10)}...`);
    return res.status(200).json({ token });
  } catch (error) {
    console.error('[ERROR] Detalle del error:', error);
    return res.status(500).json({ error: error.toString() });
  }
});

exports.createAgoraToken = functions.https.onRequest(app);
