/* eslint-disable global-require */
// index.js (Firebase Functions para tokens de Agora RTC)

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const chatToken = require('./chatToken');

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

exports.createAgoraToken = functions.https.onRequest(app);
exports.createAgoraChatToken = chatToken.createAgoraChatToken;
