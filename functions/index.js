const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Configura tus credenciales de Agora en las variables de entorno de Firebase
const appID = functions.config().agora.app_id;
const appCertificate = functions.config().agora.app_certificate;

exports.createAgoraToken = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { channelId, role } = req.query;
    const uid = Number(req.query.uid) || 0;
    const expireTime = 3600; // Token válido por 1 hora
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expireTime;

    if (!channelId || !role) {
      return res.status(400).json({ error: 'channelId y role son requeridos' });
    }

    // Determina el rol para Agora basado en el parámetro recibido
    let agoraRole;
    if (role === 'uidHost') {
      agoraRole = RtcRole.PUBLISHER; // Host (gestiona el canal)
    } else {
      agoraRole = RtcRole.SUBSCRIBER; // Invitado
    }

    try {
      const token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelId,
        uid,
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
