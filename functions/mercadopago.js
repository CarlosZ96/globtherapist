/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { getEmailHtml } = require('./emailTemplate');

admin.initializeApp();
const db = admin.firestore();

const mercadopagoApp = express();

// Configuración CORS mejorada
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://globtherapist.vercel.app',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

functions.config({
  timeoutSeconds: 120,
  memory: '1GB',
});

// Middleware optimizado
mercadopagoApp.use(cors(corsOptions));
mercadopagoApp.use(express.json());
mercadopagoApp.options('*', cors(corsOptions));

// Endpoint de salud
mercadopagoApp.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: Date.now() });
});

// Cliente MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.REACT_APP_MP_ACCESS_TOKEN,
});

// Controlador de métodos de pago
mercadopagoApp.get('/getPaymentMethods', async (req, res) => {
  try {
    const paymentMethod = new PaymentMethod(client);
    const methods = await paymentMethod.get();
    const pseMethod = methods.find((m) => m.id === 'pse');

    if (!pseMethod) return res.status(404).json({ error: 'Método PSE no disponible' });

    res.status(200).json({
      banks: pseMethod.financial_institutions.map((b) => ({
        id: String(b.id).padStart(4, '0'),
        name: b.description,
      })),
      minAmount: pseMethod.min_allowed_amount,
      maxAmount: pseMethod.max_allowed_amount,
    });
  } catch (error) {
    functions.logger.error('Error en métodos de pago:', error);
    res.status(500).json({ error: error.message });
  }
});

mercadopagoApp.post('/createPayment', async (req, res) => {
  try {
    const payment = new Payment(client);
    const { body } = req;
    const isPSE = body.paymentMethodId === 'pse';

    const basePaymentData = {
      transaction_amount: Number(body.amount),
      description: `Terapia ${body.therapyType}`,
      payment_method_id: body.paymentMethodId,
      payer: {
        email: body.payerData.email,
        identification: {
          type: body.payerData.docType,
          number: String(body.payerData.docNumber).replace(/\D/g, ''),
        },
      },
      additional_info: {
        ip_address: req.headers['x-forwarded-for'] || '127.0.0.1',
      },
      metadata: body.metadata,
    };

    if (isPSE) {
      basePaymentData.payer.entity_type = body.pseData.entityType;
      basePaymentData.transaction_details = { financial_institution: body.pseData.bank };
      basePaymentData.callback_url = 'http://localhost:3000/payment-callback';
    }

    const result = await payment.create({
      body: basePaymentData,
      requestOptions: { idempotencyKey: crypto.randomUUID() },
    });

    const responseData = {
      id: result.id,
      status: result.status,
      payment_method: body.paymentMethodId,
      redirect_url: isPSE
        ? result.transaction_details.external_resource_url
        : result.point_of_interaction?.transaction_data?.ticket_url,
    };

    if (isPSE) {
      await db.collection('pendingPayments').doc(result.id).set({
        status: 'pending',
        created: admin.firestore.FieldValue.serverTimestamp(),
        ...body.metadata.citaData,
      });
    }

    res.status(200).json(responseData);
  } catch (error) {
    functions.logger.error('Error procesando pago:', error);
    res.status(500).json({
      error: 'Error procesando el pago',
      code: error.response?.data?.error || 'MP_ERROR',
      message: error.message,
    });
  }
});

mercadopagoApp.post('/mpWebhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data.id) {
      const payment = new Payment(client);
      const paymentId = data.id;
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        const paymentRef = db.collection('pendingPayments').doc(paymentId);
        const snapshot = await paymentRef.get();

        if (snapshot.exists) {
          const citaData = snapshot.data();
          const batch = db.batch();

          // Actualizar usuario
          batch.update(db.collection('users').doc(citaData.userId), {
            Citas: admin.firestore.FieldValue.arrayUnion({
              date: citaData.date,
              month: citaData.month,
              time: citaData.time,
              therapyType: citaData.therapyType,
              status: 'paid',
              proName: citaData.proName,
              proUid: citaData.proId,
              description: citaData.description,
            }),
          });

          // Actualizar profesional
          batch.update(db.collection('pros').doc(citaData.proId), {
            MisCitas: admin.firestore.FieldValue.arrayUnion({
              date: citaData.date,
              month: citaData.month,
              time: citaData.time,
              therapyType: citaData.therapyType,
              userName: citaData.userName,
              userEmail: citaData.userEmail,
              userPhone: citaData.userPhone,
              status: 'paid',
              userId: citaData.userId,
            }),
          });

          await batch.commit();

          // Enviar correos
          const emailData = {
            therapyType: citaData.therapyType,
            date: citaData.date.toString(),
            dayOfWeek: citaData.dayOfWeek,
            fullDate: `de ${citaData.month} a las ${citaData.time}`,
            userName: citaData.userName,
            proName: citaData.proName,
            userEmail: citaData.userEmail,
            userProfession: citaData.userProfession,
            userTel: citaData.userPhone,
          };

          const mailCollection = db.collection('mail');
          await Promise.all([
            mailCollection.add({
              to: citaData.userEmail,
              message: {
                subject: 'Confirmación de cita - GLOBTHERAPIST',
                html: getEmailHtml({ ...emailData, collection: 'users' }),
              },
            }),
            mailCollection.add({
              to: citaData.proEmail,
              message: {
                subject: 'Nueva cita agendada - GLOBTHERAPIST',
                html: getEmailHtml({ ...emailData, collection: 'pros' }),
              },
            }),
          ]);

          await paymentRef.delete();
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    functions.logger.error('Error en webhook:', error);
    res.status(500).send('Error procesando webhook');
  }
});

exports.handler = functions.https.onRequest(mercadopagoApp);
