/* eslint-disable global-require */
const functions = require('firebase-functions');
const { RtmTokenBuilder, RtmRole } = require('agora-access-token');

exports.createAgoraChatToken = functions.https.onRequest(async (req, res) => {
  // Configurar CORS manualmente
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar solicitud preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

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

    const expireTime = 3600; // 1 hora
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expireTime;

    // Construir token RTM
    const token = RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      userId,
      RtmRole.Rtm_User,
      privilegeExpireTime,
    );

    return res.status(200).json({
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
