/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getAuth } from 'firebase/auth';
import {
  doc, getDoc, updateDoc, addDoc, collection, getDocs, arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import Calendar from './Calendar/CalendarWithToggle';
import Mp from './payments/MP';
import StatusBrick from './payments/StatusBrick';
import getEmailHtml from './mails/emailTemplate';
import '../stylesheets/Therapy.css';

const Therapy = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const {
    currentUser, updateUserCitas, updateProMisCitas, pros, citaGlobal, setCitaGlobal,
  } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [retryPayment, setRetryPayment] = useState(false);
  const therapyPrices = {
    Fisica: 70000,
    Lenguaje: 55000,
    Mental: 80000,
    Ocupacional: 41000,
  };
  const normalizeText = (text) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const calculateEndTime = (start, minutesToAdd) => {
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [showAppointmentError, setShowAppointmentError] = useState(false);
  const [selectedPro, setSelectedPro] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleDateSelection = (appointments) => {
    console.log('Citas seleccionadas recibidas:', appointments);
    setSelectedAppointments(appointments);
    setShowAppointmentError(false);
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: user?.email || '',
    therapyType: '',
    description: '',
  });

  const normalizeTime = (time) => {
    const timeLower = time.toLowerCase();
    const [hour, minute] = timeLower.replace(/[^0-9:]/g, '').split(':');
    let normalizedHour = parseInt(hour, 10);
    if (timeLower.includes('pm') && normalizedHour !== 12) {
      normalizedHour += 12;
    }
    if (timeLower.includes('am') && normalizedHour === 12) {
      normalizedHour = 0;
    }
    return `${String(normalizedHour).padStart(2, '0')}:${minute}`;
  };

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: '',
    therapyType: '',
  });

  const fieldRefs = {
    name: React.createRef(),
    phone: React.createRef(),
    email: React.createRef(),
    therapyType: React.createRef(),
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      phone: '',
      email: '',
      therapyType: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
      if (fieldRefs.name.current) {
        fieldRefs.name.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      isValid = false;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
      if (fieldRefs.phone.current) {
        fieldRefs.phone.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
      if (fieldRefs.email.current) {
        fieldRefs.email.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      isValid = false;
    }
    if (!formData.therapyType) {
      newErrors.therapyType = 'Debes elegir un tipo de terapia';
      if (fieldRefs.therapyType.current) {
        fieldRefs.therapyType.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleTherapyTypeClick = (type) => {
    console.log('Therapy type selected:', type);
    setFormData({ ...formData, therapyType: type });
  };

  const handleProSelection = async (proId) => {
    if (!citaGlobal) {
      Swal.fire({
        icon: 'warning',
        title: 'Cita no seleccionada',
        text: 'Por favor, selecciona una cita antes de ver los profesionales.',
      });
      return;
    }
    try {
      const proDocRef = doc(db, 'pros', proId);
      const proDoc = await getDoc(proDocRef);

      if (proDoc.exists()) {
        const proData = proDoc.data();
        setCitaGlobal((prev) => ({
          ...prev,
          proName: proData.Nombre || 'Profesional no encontrado',
        }));
        setShowAppointmentError(false);
      }
    } catch (error) {
      console.error('Error al seleccionar el profesional:', error);
    }
    if (!formData.therapyType) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección incompleta',
        text: 'Por favor, selecciona un tipo de terapia antes de ver los profesionales.',
      });
      return;
    }

    try {
      const normalizedTherapyType = normalizeText(formData.therapyType);
      console.log('Normalized therapyType from formData:', normalizedTherapyType);

      const proDocRef = doc(db, 'pros', proId);
      const proDoc = await getDoc(proDocRef);

      if (!proDoc.exists()) {
        console.error('Profesional no encontrado.');
        return;
      }

      const proData = proDoc.data();
      console.log('Professional data:', proData);
      const { horarios, terapias } = proData;
      const normalizedTerapias = terapias?.map((t) => {
        const normT = normalizeText(t);
        console.log(`Therapy "${t}" normalized as:`, normT);
        return normT;
      });
      console.log('Normalized therapies for professional:', normalizedTerapias);

      if (!normalizedTerapias?.includes(normalizedTherapyType)) {
        console.error('Therapy type mismatch:', { normalizedTherapyType, normalizedTerapias });
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El profesional no ofrece este tipo de terapia.',
        });
        return;
      }

      const normalizedSelectedTime = normalizeTime(citaGlobal.time);
      console.log('Normalized selected time:', normalizedSelectedTime);
      console.log('Horarios from professional:', horarios);

      const hasAvailability = horarios?.[citaGlobal.month]?.some((day) => {
        console.log('Checking day:', day);
        if (day.date !== citaGlobal.date) {
          console.log(`Day ${day.date} does not match selected appointment date ${citaGlobal.date}`);
          return false;
        }
        const timeSlotMatch = day.Timeslots.some((timeslot) => {
          const [startTime] = timeslot.split('-');
          const normalizedStartTime = normalizeTime(startTime);
          console.log(`Comparing timeslot: normalizedStartTime=${normalizedStartTime} vs normalizedSelectedTime=${normalizedSelectedTime}`);
          return normalizedStartTime === normalizedSelectedTime;
        });
        console.log('Result for day', day.date, ':', timeSlotMatch);
        return timeSlotMatch;
      });
      console.log('Availability check result:', hasAvailability);

      if (hasAvailability) {
        setSelectedPro(proId);
        Swal.fire({
          icon: 'success',
          title: 'Disponible',
          text: 'Profesional disponible para la cita seleccionada.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No disponible',
          text: 'El profesional no tiene disponibilidad en la fecha y hora seleccionadas.',
        });
      }
    } catch (error) {
      console.error('Error al verificar disponibilidad del profesional:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validar formulario
    if (!validateForm()) {
      console.error('El formulario no es válido.');
      Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos requeridos.',
      });
      return;
    }

    // Validar usuario autenticado
    if (!currentUser) {
      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: 'Debes iniciar sesión para agendar una cita.',
      });
      return;
    }

    // Validar cita seleccionada
    if (!citaGlobal?.date || !citaGlobal?.time) {
      Swal.fire({
        icon: 'warning',
        title: 'Cita no seleccionada',
        text: 'Por favor selecciona una fecha y hora para la cita.',
      });
      return;
    }

    // Validar profesional seleccionado
    if (!selectedPro) {
      Swal.fire({
        icon: 'warning',
        title: 'Profesional no seleccionado',
        text: 'Por favor selecciona un profesional para la cita.',
      });
      return;
    }

    setShowPayment(true);
  };

  const getDateProInfo = (therapyType) => {
    const normalizedType = normalizeText(therapyType);

    switch (normalizedType) {
      case 'mental':
        return {
          estadoAnimico: '',
          sintomas: '',
          tecnicasUsadas: [],
          recomendaciones: '',
        };
      case 'fisica':
        return {
          movilidadObservada: '',
          rangoArticula: '',
          escalaDeDolor: { localizacion: '', intensidad: 0 },
          ejerciciosRealizados: [],
          recomendaciones: '',
        };
      case 'lenguaje':
        return {
          comprension: '',
          expresionVerbal: '',
          ejerciciosRealizados: [],
          denominacion: '',
          recomendaciones: '',
        };
      case 'ocupacional':
        return {
          nivelDeIndependencia: '',
          destrezasMotorasFinas: '',
          ejerciciosRealizados: [],
          adaptacionesSugeridas: { hogar: '', trabajo: '' },
          recomendaciones: '',
        };
      default:
        return {};
    }
  };

  const handlePaymentSuccess = async (paymentInfo) => {
    const proDocRef = doc(db, 'pros', selectedPro);
    try {
      const { id: paymentId, method: paymentMethod } = paymentInfo;
      const amount = therapyPrices[formData.therapyType];
      const paymentDate = new Date().toISOString();

      if (!currentUser || !currentUser.uid) throw new Error('Usuario no autenticado');
      if (!selectedPro) throw new Error('Profesional no seleccionado');

      const getDayOfWeek = () => {
        const monthMap = {
          enero: 0,
          febrero: 1,
          marzo: 2,
          abril: 3,
          mayo: 4,
          junio: 5,
          julio: 6,
          agosto: 7,
          septiembre: 8,
          octubre: 9,
          noviembre: 10,
          diciembre: 11,
        };

        const year = new Date().getFullYear();
        const month = monthMap[citaGlobal.month.toLowerCase()];
        const dateObj = new Date(year, month, citaGlobal.date);

        return dateObj.toLocaleDateString('es-ES', { weekday: 'short' })
          .replace('.', '')
          .toLowerCase();
      };

      const citaId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const userCita = {
        id: citaId,
        date: citaGlobal.date,
        month: citaGlobal.month,
        time: citaGlobal.time,
        startTime: normalizeTime(citaGlobal.time),
        endTime: calculateEndTime(normalizeTime(citaGlobal.time), 40),
        duration: 40,
        therapyType: normalizeText(formData.therapyType),
        description: formData.description,
        status: 'pay_pending',
        uid: citaGlobal.uid,
        proName: citaGlobal.proName || 'Profesional',
        proUid: selectedPro,
        dayOfWeek: getDayOfWeek(),
        createdAt: new Date().toISOString(),
        payment: {
          paymentId,
          amount,
          paymentMethod,
          status: 'approved',
          paymentDate,
          therapyType: formData.therapyType,
        },
      };

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userCurrentData = userSnap.data();

      const proSnap = await getDoc(proDocRef);
      const proCurrentData = proSnap.data();

      const proCita = {
        ...userCita,
        userEmail: formData.email,
        userName: formData.name,
        userPhone: formData.phone,
        userId: currentUser.uid,
        payment: userCita.payment,
        DateProInfo: getDateProInfo(formData.therapyType),
      };

      await Promise.all([
        updateDoc(userRef, {
          Citas: arrayUnion(userCita),
        }),
        updateDoc(proDocRef, {
          MisCitas: arrayUnion(proCita),
        }),
      ]);

      const emailData = {
        therapyType: formData.therapyType.toLowerCase(),
        date: citaGlobal.date.toString(),
        dayOfWeek: userCita.dayOfWeek,
        fullDate: `de ${citaGlobal.month} a las ${citaGlobal.time}`,
        userName: formData.name,
        proName: proCurrentData.Nombre || 'Profesional',
        userEmail: proCurrentData.email,
        userProfession: proCurrentData.profesion || 'Profesional de salud',
        userTel: formData.phone,
        price: therapyPrices[formData.therapyType],
      };

      await Promise.all([
        addDoc(collection(db, 'mail'), {
          to: formData.email,
          message: {
            subject: 'Confirmación de cita - GLOBTHERAPIST',
            html: getEmailHtml({
              ...emailData,
              collection: 'users',
            }),
          },
        }),
        addDoc(collection(db, 'mail'), {
          to: proCurrentData.email,
          message: {
            subject: 'Nueva cita agendada - GLOBTHERAPIST',
            html: getEmailHtml({
              ...emailData,
              collection: 'pros',
              userEmail: formData.email,
              userTel: formData.phone,
            }),
          },
        }),
      ]);

      // Actualización: Guardar detalles del pago y mostrar StatusBrick
      setPaymentDetails({
        id: paymentId,
        amount,
        method: paymentMethod,
        status: 'approved',
      });
      setPaymentStatus('success');
      setShowPayment(false);
    } catch (error) {
      console.error('Error detallado:', {
        message: error.message,
        code: error.code,
        operation: 'updateDoc',
        userId: currentUser?.uid,
        proId: selectedPro,
      });

      Swal.fire({
        icon: 'error',
        title: 'Error en el proceso',
        html: `No se pudo completar la operación:<br>
         <strong>Código:</strong> ${error.code || 'N/A'}<br>
         <strong>Mensaje:</strong> ${error.message}`,
        footer: 'Verifica las reglas de seguridad en Firestore',
      });
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData((prevData) => ({
            ...prevData,
            phone: userData.telefono || 'Teléfono no encontrado',
          }));
        } else {
          console.error('No se encontró el documento del usuario en Firestore.');
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleCloseStatus = () => {
    setPaymentStatus(null);
    window.location.reload();
  };

  return (
    <form className="Therapy-body" onSubmit={handleSubmit}>
      <div className="Therapy-title-cont">
        <h1>GLOBTHERAPIST</h1>
      </div>
      <div className="Ask-Therapy">
        <div className="Ask-Therapy-subtittle">
          <h2>Agenda tu terapia</h2>
        </div>
        <div className="Ask-Therapy-fields-conts">
          <div className="Ask-Therapy-field-cont">
            <h3>Nombre completo:</h3>
            <input
              ref={fieldRefs.name}
              className="Ask-Therapy-fields-input"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <h5 className="error-text">{errors.name}</h5>}
          </div>
          <div className="Ask-Therapy-field-cont">
            <h3>Teléfono:</h3>
            <input
              ref={fieldRefs.phone}
              className="Ask-Therapy-fields-input"
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            {errors.phone && <h5 className="error-text">{errors.phone}</h5>}
          </div>
          <div className="Ask-Therapy-field-cont">
            <h3>Email:</h3>
            <input
              ref={fieldRefs.email}
              className="Ask-Therapy-fields-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <h5 className="error-text">{errors.email}</h5>}
          </div>
        </div>
        <hr className="white-line" />
        <div className="Ask-Therapy-txt">
          <h3>Elige el tipo de terapia que deseas:</h3>
        </div>
        <div className="Therapies-cont">
          {['Fisica', 'Lenguaje', 'Mental', 'Ocupacional'].map((type) => (
            <button
              key={type}
              type="button"
              className={
                formData.therapyType === type
                  ? 'Therapy-tittle-cont Therapy-tittle'
                  : 'inactive-cont inactive-txt'
              }
              onClick={() => handleTherapyTypeClick(type)}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.therapyType && (
          <div className="error-container">
            <h5 className="error-text">{errors.therapyType}</h5>
          </div>
        )}
        <div className="Therapy-info">
          <textarea
            className="Therapy-txt-field"
            placeholder="Explícanos brevemente por qué requieres tu terapia."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <hr className="white-line" />
        <div className="Ask-Therapy-txt">
          <h3>¿Qué día y a qué horas quieres tu cita?</h3>
        </div>
        <div className="calendar-cont">
          <Calendar
            collection="users"
            onDateSelection={handleDateSelection}
            therapyType={formData.therapyType}
            onProSelection={handleProSelection}
          />
          {showAppointmentError && (
            <div className="appointment-error">
              <h5 className="error-text">Por favor, selecciona al menos una cita.</h5>
            </div>
          )}
        </div>
        {citaGlobal.date && citaGlobal.month && citaGlobal.time && citaGlobal.proName && (
          <div className="DynamiCanlendar-btn-cont">
            <div className="Date-info-cont">
              <div className="Date-info-txt">
                <h3>Tu cita quedó para el:</h3>
              </div>
              <div className="Date-info-description">
                <p className="appointment-date">
                  {citaGlobal.date}
                  {' '}
                  de
                  {' '}
                  {citaGlobal.month}
                  {' '}
                  del
                  {' '}
                  {new Date().getFullYear()}
                </p>
                <p className="appointment-time">
                  de:
                  {citaGlobal.time}
                  {' '}
                  a
                  {calculateEndTime(normalizeTime(citaGlobal.time), 40)}
                </p>
                <p className="appointment-doctor">
                  Con el doctor
                  {citaGlobal.proName}
                </p>
                <div className="therapy-price-info">
                  <p className="appointment-therapy">
                    Terapia
                    {formData.therapyType}
                    : $
                    {therapyPrices[formData.therapyType]?.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>

            {showPayment && (
              <div className="payment-modal">
                <button
                  type="button"
                  className="close-payment-btn"
                  onClick={() => setShowPayment(false)}
                >
                  X
                </button>
                <Mp
                  key={retryPayment ? 'retry' : 'initial'}
                  therapyType={formData.therapyType}
                  onPaymentSuccess={handlePaymentSuccess}
                  currentUser={currentUser}
                  selectedPro={selectedPro}
                  citaGlobal={citaGlobal}
                  formData={formData}
                />
              </div>
            )}

            <button type="submit" className="DynamiCanlendar-btn">
              <h4>Confirmar e ir a pagar</h4>
            </button>
          </div>
        )}
      </div>

      {paymentStatus === 'success' && paymentDetails && (
        <StatusBrick
          paymentDetails={paymentDetails}
          onClose={handleCloseStatus}
          onRetry={() => {
            setPaymentStatus(null);
            setShowPayment(true);
            setRetryPayment(true);
          }}
        />
      )}
    </form>
  );
};

export default Therapy;
