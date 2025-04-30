/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { MercadoPagoConfig, Payment, PaymentMethod } = require('mercadopago');
const cors = require('cors')({ origin: true });
const getEmailHtml = require('../src/Components/mails/emailTemplate');

admin.initializeApp();
const db = admin.firestore();

const client = new MercadoPagoConfig({
  accessToken: process.env.REACT_APP_MERCADOPAGO_ACCESS_TOKEN,
});

const payment = new Payment(client);
const paymentMethodClient = new PaymentMethod(client);

exports.getPaymentMethods = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const methods = await paymentMethodClient.get();
      const pseMethod = methods.find((m) => m.id === 'pse');

      if (!pseMethod) throw new Error('Método PSE no encontrado');

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
  });
});

exports.createPayment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
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
        basePaymentData.transaction_details = {
          financial_institution: body.pseData.bank,
        };
        basePaymentData.callback_url = 'https://globtherapist.vercel.app/payment-callback';
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
          : result.point_of_interaction.transaction_data.ticket_url,
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
      functions.logger.error('Error detallado:', error);
      res.status(500).json({
        error: 'Error procesando el pago',
        code: error.response?.data?.error || 'MP_ERROR',
        message: error.message,
      });
    }
  });
});

exports.mpWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data.id) {
      const paymentId = data.id;
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        const paymentRef = db.collection('pendingPayments').doc(paymentId);
        const snapshot = await paymentRef.get();

        if (!snapshot.exists) {
          return res.status(404).send('Cita no encontrada');
        }

        const citaData = snapshot.data();

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
          }),
        });

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

        // Email para usuario
        await db.collection('mail').add({
          to: citaData.userEmail,
          message: {
            subject: 'Confirmación de cita - GLOBTHERAPIST',
            html: getEmailHtml({ ...emailData, collection: 'users' }),
          },
        });

        // Email para profesional
        await db.collection('mail').add({
          to: citaData.proEmail,
          message: {
            subject: 'Nueva cita agendada - GLOBTHERAPIST',
            html: getEmailHtml({ ...emailData, collection: 'pros' }),
          },
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
