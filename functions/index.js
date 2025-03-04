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

// Para Agora Chat, usa el paquete agora-token
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
// Nota: Usamos ChatTokenBuilder para generar el token de chat
app.get('/createAgoraChatToken', (req, res) => {
  console.log('[DEBUG] AGORA_CHAT_APP_ID:', process.env.AGORA_CHAT_APP_ID);
  console.log('[DEBUG] AGORA_CHAT_APP_CERTIFICATE:', `${process.env.AGORA_CHAT_APP_CERTIFICATE?.substring(0, 5)}...`); // Muestra solo los primeros 5 caracteres del certificado
  console.log('[DEBUG] userId recibido:', req.query.userId);

  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  const { userId } = req.query;
  if (!userId || userId.trim() === '') {
    return res.status(400).json({ error: 'userId es requerido y no puede estar vacío' });
  }

  try {
    const token = ChatTokenBuilder.buildUserToken(
      process.env.AGORA_CHAT_APP_ID, // App ID de Chat (AppKey)
      process.env.AGORA_CHAT_APP_CERTIFICATE, // App Certificate (OrgName)
      userId,
      3600,
    );
    console.log('[DEBUG] Token generado:', `${token?.substring(0, 10)}...`); // Muestra solo los primeros 10 caracteres del token
    return res.status(200).json({ token });
  } catch (error) {
    console.error('[ERROR] Detalle del error:', error);
    return res.status(500).json({ error: error.toString() });
  }
});

exports.createAgoraToken = functions.https.onRequest(app);
