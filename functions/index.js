// Cargar las variables de entorno desde el archivo .env (sólo en desarrollo)
require('dotenv').config();

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000',
  'https://globtherapist.vercel.app',
];

// Configuración de CORS
const corsOptions = {
  origin(origin, callback) {
    // Permitir solicitudes sin origen (por ejemplo, herramientas de testing)
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
  // Forzar el header CORS en la respuesta
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');

  const { channelId, role, uid } = req.query;
  const numericUid = Number(uid) || 0;
  const expireTime = 3600; // Token válido por 1 hora
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTime;

  if (!channelId || !role) {
    return res.status(400).json({ error: 'channelId y role son requeridos' });
  }

  // Determina el rol para Agora:
  // Si role es 'uidHost' se asigna PUBLISHER, de lo contrario SUBSCRIBER
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

exports.createAgoraToken = functions.https.onRequest(app);
