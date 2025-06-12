/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
require('dotenv').config();
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const cors = require('cors')({
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
const express = require('express');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});
const payment = new Payment(client);
const paymentMethodClient = new PaymentMethod(client);
const handleCors = (handler) => (req, res) => {
  return cors(req, res, async () => {
    try {
      await handler(req, res);
    } catch (error) {
      functions.logger.error('Error global:', error);
      res.status(500).json({ error: error.message });
    }
  });
};

exports.getPaymentMethods = functions.https.onRequest(handleCors(async (req, res) => {
  try {
    const methods = await paymentMethodClient.get();
    const pseMethod = methods.find((m) => m.id === 'pse');

    if (!pseMethod) throw new Error('Método PSE no encontrado');
    console.log('accessToken', process.env.REACT_APP_MERCADOPAGO_ACCESS_TOKEN);
    res.status(200).json({
      banks: pseMethod.financial_institutions.map((b) => ({
        id: String(b.id).padStart(4, '0'),
        name: b.description,
      })),
      minAmount: pseMethod.min_allowed_amount,
      maxAmount: pseMethod.max_allowed_amount,
    });
  } catch (error) {
    functions.logger.error('Error en getPaymentMethods:', error);
    res.status(500).json({
      error: 'Error obteniendo métodos de pago',
      details: error.message,
    });
  }
}));

exports.createPayment = functions.https.onRequest(handleCors(async (req, res) => {
  try {
    const { body } = req;

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: 'Cuerpo de solicitud vacío' });
    }

    const requiredFields = ['paymentMethodId', 'amount', 'therapyType', 'payerData'];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        missing: missingFields,
      });
    }

    const isPSE = body.paymentMethodId === 'pse';

    if (isPSE) {
      if (!body.pseData?.bank || !body.pseData?.entityType) {
        return res.status(400).json({ error: 'Datos PSE incompletos' });
      }
    }

    // Construcción del payload segura
    const basePaymentData = {
      transaction_amount: Number(body.amount),
      description: `Terapia ${body.therapyType}`,
      payment_method_id: body.paymentMethodId,
      payer: {
        email: body.payerData.email || '',
        identification: {
          type: body.payerData.docType || 'CC',
          number: String(body.payerData.docNumber || '').replace(/\D/g, ''),
        },
      },
      additional_info: {
        ip_address: req.headers['x-forwarded-for'] || '127.0.0.1',
      },
      metadata: body.metadata || {},
    };

    if (isPSE) {
      basePaymentData.payer.entity_type = body.pseData.entityType;
      basePaymentData.transaction_details = {
        financial_institution: body.pseData.bank,
      };
      basePaymentData.callback_url = 'https://globtherapist.vercel.app/';
    } else {
      if (!body.cardData?.token) {
        return res.status(400).json({ error: 'Token de tarjeta requerido' });
      }
      basePaymentData.token = body.cardData.token;
      basePaymentData.installments = Number(body.cardData.installments) || 1;
      basePaymentData.issuer_id = body.cardData.issuerId || '';
    }

    const result = await payment.create({
      body: basePaymentData,
      requestOptions: { idempotencyKey: crypto.randomUUID() },
    });

    if (isPSE) {
      const transactionId = String(result.id || '').trim();
      if (!transactionId || transactionId === '') {
        functions.logger.error('ID de transacción inválido:', { result });
        throw new Error('ID de transacción no válido recibido de MercadoPago');
      }

      const docRef = db.collection('pendingPayments').doc(transactionId);

      await docRef.set({
        status: 'pending',
        created: admin.firestore.FieldValue.serverTimestamp(),
        ...(body.metadata?.citaData || {}),
        transactionId,
        mpRawId: result.id,
      });

      functions.logger.info('Documento creado con ID:', transactionId);
    }

    res.status(200).json({
      id: result.id,
      status: result.status,
      redirect_url: result.transaction_details?.external_resource_url,
    });
  } catch (error) {
    functions.logger.error('Error detallado:', {
      error: error.stack,
      requestBody: req.body,
    });

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: 'Error en el proceso de pago',
      message: error.message,
      details: error.response?.data || null,
    });
  }
}));

exports.mpWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data.id) {
      const paymentId = data.id;
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        const paymentRef = db.collection('pendingPayments').doc(paymentId);
        const snapshot = await paymentRef.get();

        if (!snapshot.exists) return res.status(404).send('Cita no encontrada');

        const citaData = snapshot.data();
        const citaId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const paymentDate = paymentInfo.date_approved;

        // Guardar pago en usuario
        const userPaymentRef = db.collection('users').doc(citaData.userId).collection('payments');
        await userPaymentRef.add({
          paymentId,
          citaId,
          amount: paymentInfo.transaction_amount,
          paymentMethod: paymentInfo.payment_method_id,
          status: paymentInfo.status,
          paymentDate,
          proId: citaData.proId,
          therapyType: citaData.therapyType,
        });

        // Guardar pago en profesional
        const proPaymentRef = db.collection('pros').doc(citaData.proId).collection('payments');
        await proPaymentRef.add({
          paymentId,
          citaId,
          amount: paymentInfo.transaction_amount,
          paymentMethod: paymentInfo.payment_method_id,
          status: paymentInfo.status,
          paymentDate,
          userId: citaData.userId,
          therapyType: citaData.therapyType,
        });

        // Crear cita para usuario
        const userRef = db.collection('users').doc(citaData.userId);
        await userRef.update({
          Citas: admin.firestore.FieldValue.arrayUnion({
            date: citaData.date,
            month: citaData.month,
            time: citaData.time,
            therapyType: citaData.therapyType,
            status: 'paid',
            proName: citaData.proName,
            proUid: citaData.proId,
            description: citaData.description,
            citaId,
          }),
        });

        // Crear cita para profesional
        const proRef = db.collection('pros').doc(citaData.proId);
        await proRef.update({
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
            citaId,
          }),
        });

        await paymentRef.delete();
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    functions.logger.error('Error en webhook:', error);
    res.status(500).send('Error procesando webhook');
  }
});
