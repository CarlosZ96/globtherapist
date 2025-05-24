const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { RtmTokenBuilder, RtmRole } = require('agora-access-token');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://globtherapist.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.get('/', (req, res) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  const { userId, channelId } = req.query;

  if (!userId || !channelId) {
    return res.status(400).json({ error: 'userId y channelId son requeridos' });
  }

  try {
    const token = RtmTokenBuilder.buildToken(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      userId,
      RtmRole.Rtm_User,
      3600,
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error generando token RTM:', error);
    return res.status(500).json({ error: error.message });
  }
});

exports.createAgoraChatToken = functions.https.onRequest(app);
