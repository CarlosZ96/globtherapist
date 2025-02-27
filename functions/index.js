const functions = require('firebase-functions');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Configura tus credenciales de Agora en las variables de entorno de Firebase:
// firebase functions:config:set agora.app_id="TU_APP_ID" agora.app_certificate="TU_APP_CERTIFICATE"
const appID = functions.config().agora.app_id;
const appCertificate = functions.config().agora.app_certificate;

exports.createAgoraToken = functions.https.onRequest((req, res) => {
  // Espera recibir los siguientes parámetros por query: channelId, role y opcionalmente uid
  const channelId = req.query.channelId;
  const roleParam = req.query.role; // "uidHost" o "uidGuest"
  const uid = Number(req.query.uid) || 0;
  const expireTime = 3600; // Token válido por 1 hora
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTime;

  if (!channelId || !roleParam) {
    return res.status(400).json({ error: "channelId y role son requeridos" });
  }

  // Determina el rol para Agora basado en el parámetro recibido
  let role;
  if (roleParam === "uidHost") {
    role = RtcRole.PUBLISHER; // Host (quien crea y gestiona el canal)
  } else {
    // Para el invitado se puede usar SUBSCRIBER
    role = RtcRole.SUBSCRIBER;
  }

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelId,
      uid,
      role,
      privilegeExpireTime
    );
    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).json({ error: error.toString() });
  }
});
