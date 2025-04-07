/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getAuth } from 'firebase/auth';
import {
  doc, getDoc, updateDoc, addDoc, collection,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import Calendar from './Calendar/CalendarWithToggle';
import Mp from './payments/MP';
import getEmailHtml from './mails/emailTemplate';
import '../stylesheets/Therapy.css';

const Therapy = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const {
    currentUser, updateUserCitas, updateProMisCitas, pros, citaGlobal, setCitaGlobal,
  } = useAuth();

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
    if (!validateForm()) {
      console.error('El formulario no es válido.');
      return;
    }

    if (!currentUser) {
      console.error('Usuario no autenticado.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debes iniciar sesión para agendar una cita.',
      });
      return;
    }

    if (!citaGlobal) {
      Swal.fire({
        icon: 'warning',
        title: 'Cita no seleccionada',
        text: 'Por favor, selecciona una cita antes de confirmar.',
      });
      return;
    }

    if (!selectedPro) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección incompleta',
        text: 'Por favor, selecciona un profesional.',
      });
      return;
    }

    try {
      const proDocRef = doc(db, 'pros', selectedPro);
      const proDoc = await getDoc(proDocRef);
      const proName = proDoc.data()?.username || 'Profesional no encontrado';
      const proData = proDoc.data();
      const horarios = proData.horarios || {};
      const monthHorarios = horarios[citaGlobal.month] || [];

      const emailData = {
        collection: 'users',
        therapyType: formData.therapyType.toLowerCase(),
        date: citaGlobal.date,
        fullDate: `de ${citaGlobal.month} a las ${citaGlobal.time}`,
        userName: formData.name,
        proName: proData.username,
        userEmail: formData.email,
        userTel: formData.phone,
        userProfession: proData.especialidad || 'Terapeuta',
      };

      await addDoc(collection(db, 'mail'), {
        to: formData.email,
        message: {
          subject: 'Confirmación de cita - GLOBTHERAPIST',
          html: getEmailHtml(emailData),
        },
      });

      const proEmailData = {
        ...emailData,
        collection: 'pros',
        userProfession: formData.therapyType,
      };

      await addDoc(collection(db, 'mail'), {
        to: proData.email,
        message: {
          subject: 'Nueva cita agendada - GLOBTHERAPIST',
          html: getEmailHtml(proEmailData),
        },
      });

      const updatedMonthHorarios = monthHorarios.map((day) => {
        if (day.date === citaGlobal.date) {
          const updatedTimeslots = day.Timeslots.filter((timeslot) => {
            const [startTimeSlot] = timeslot.split('-');
            return normalizeTime(startTimeSlot) !== normalizeTime(citaGlobal.time);
          });
          return { ...day, Timeslots: updatedTimeslots };
        }
        return day;
      });

      await updateDoc(proDocRef, {
        horarios: {
          ...horarios, [citaGlobal.month]: updatedMonthHorarios,
        },
      });
      const normalizedSelectedTime = normalizeTime(citaGlobal.time);
      const startTime = normalizedSelectedTime;
      const endTime = calculateEndTime(normalizedSelectedTime, 40);
      const duration = 40;
      const userCita = {
        date: citaGlobal.date,
        month: citaGlobal.month,
        time: citaGlobal.time,
        startTime,
        endTime,
        duration,
        therapyType: normalizeText(formData.therapyType),
        description: formData.description,
        status: 'pending',
        uid: citaGlobal.uid,
        proName,
        proUid: selectedPro,
      };

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error('El usuario no existe en Firestore.');
        return;
      }

      const userData = userSnap.data();
      const prevCitas = userData.Citas || [];
      const updatedCitas = [...prevCitas, userCita];

      await updateDoc(userRef, { Citas: updatedCitas });
      console.log('Cita guardada en Firestore para el usuario:', userCita);

      const proCita = {
        date: citaGlobal.date,
        month: citaGlobal.month,
        time: citaGlobal.time,
        startTime,
        endTime,
        duration,
        therapyType: normalizeText(formData.therapyType),
        description: formData.description,
        status: 'pending',
        userEmail: currentUser.email,
        userName: formData.name,
        userPhone: formData.phone,
        uid: citaGlobal.uid,
        userId: currentUser.uid,
      };

      const proMisCitasRef = doc(db, 'pros', selectedPro);
      const proMisCitasSnap = await getDoc(proMisCitasRef);
      if (!proMisCitasSnap.exists()) {
        console.error('El profesional no existe en Firestore.');
        return;
      }

      const proMisCitasData = proMisCitasSnap.data();
      const prevMisCitas = proMisCitasData.MisCitas || [];
      const updatedMisCitas = [...prevMisCitas, proCita];

      await updateDoc(proMisCitasRef, { MisCitas: updatedMisCitas });
      console.log('Cita guardada en Firestore para el profesional:', proCita);

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'La cita ha sido agendada correctamente.',
      }).then(() => {
        window.location.reload();
      });

      setFormData({
        name: '',
        phone: '',
        email: user?.email || '',
        therapyType: '',
        description: '',
      });
      setSelectedPro(null);
      setCitaGlobal({
        date: '',
        month: '',
        time: '',
        therapyType: '',
        description: '',
        status: 'pending',
        uid: '',
        proName: '',
      });
      setSelectedAppointments([]);
      setShowAppointmentError(false);
    } catch (error) {
      console.error('Error al agendar la cita:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al agendar la cita. Por favor, inténtalo de nuevo.',
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
        <div className="DynamiCanlendar-btn-cont">
          {citaGlobal.date && citaGlobal.month && citaGlobal.time && citaGlobal.proName && (
            <div className="Date-info-cont">
              <div className="Date-info-txt">
                <h3>Tu cita quedó para el:</h3>
              </div>
              <div className="Date-info-description">
                {citaGlobal.date && citaGlobal.month && citaGlobal.time && citaGlobal.proName ? (
                  <p>
                    {citaGlobal.date}
                    {' '}
                    de
                    {citaGlobal.month}
                    {' '}
                    del
                    {new Date().getFullYear()}
                    {' '}
                    a las
                    {citaGlobal.time}
                    {' '}
                    con el doctor
                    {citaGlobal.proName}
                    .
                  </p>
                ) : (
                  <p>No hay una cita seleccionada.</p>
                )}
              </div>
            </div>
          )}
          {formData.therapyType && (
            <div style={{ marginTop: '20px' }}>
              <Mp therapyType={formData.therapyType} />
            </div>
          )}
          <button type="submit" className="DynamiCanlendar-btn">
            <h4>Confirmar</h4>
          </button>
        </div>
      </div>
    </form>
  );
};

export default Therapy;
