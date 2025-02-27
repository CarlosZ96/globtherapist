const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();

// Configura CORS para permitir cualquier origen
const corsHandler = cors({ origin: '*' });

// Define un endpoint GET en la raíz y envuélvelo con corsHandler
app.get('/', (req, res) => {
  corsHandler(req, res, () => {
    const { channelId, role, uid } = req.query;
    const numericUid = Number(uid) || 0;
    const expireTime = 3600; // Token válido por 1 hora
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expireTime;

    if (!channelId || !role) {
      return res.status(400).json({ error: 'channelId y role son requeridos' });
    }

    // Determina el rol para Agora: uidHost = PUBLISHER, de lo contrario SUBSCRIBER
    const agoraRole = role === 'uidHost' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    try {
      const token = RtcTokenBuilder.buildTokenWithUid(
        functions.config().agora.app_id,
        functions.config().agora.app_certificate,
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
});

exports.createAgoraToken = functions.https.onRequest(app);
