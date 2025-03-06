const functions = require('firebase-functions');
const { RtmTokenBuilder, RtmRole } = require('agora-access-token'); // Cambia a RTM

exports.createAgoraChatToken = functions.https.onRequest((req, res) => {
  const { userId, channelId } = req.query;

  // Validaciones
  if (!userId || !channelId) {
    return res.status(400).json({ error: 'userId y channelId son requeridos' });
  }

  try {
    const appId = process.env.AGORA_APP_ID; // Asegúrate de que coincida con tu proyecto
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const expireTime = 3600; // 1 hora

    const token = RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      userId,
      RtmRole.Rtm_User, // Rol básico para mensajería
      expireTime,
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error generando token RTM:', error);
    return res.status(500).json({ error: error.message });
  }
});
