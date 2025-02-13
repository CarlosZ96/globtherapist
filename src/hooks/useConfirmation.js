/* eslint-disable no-plusplus */
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

const useConfirmation = (
  collectionName,
  currentUser,
  selectedDay,
  selectedTime,
  startTime,
  endTime,
  therapyType,
  onDateSelection,
  formatTime,
) => {
  const { setCitaGlobal } = useAuth();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [currentAppointmentId] = useState(null);

  const removePendingCitas = (citas) => {
    return citas.filter((cita) => cita.status !== 'pending');
  };

  const generateTimeSlots = (start, end) => {
    const timeSlots = [];
    for (let i = start; i < end; i++) {
      timeSlots.push(`${formatTime(i)}-${formatTime(i + 1)}`);
    }
    return timeSlots;
  };

  const handleConfirmHours = async () => {
    console.log('handleConfirmHours invoked');
    console.log('selectedDay:', selectedDay);

    if (!selectedDay.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección incompleta',
        text: 'Por favor, selecciona al menos un día.',
      });
      return;
    }

    try {
      const normalizedTherapyType = collectionName === 'users'
        ? therapyType
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '')
        : null;

      console.log('Normalized therapyType:', normalizedTherapyType);

      const Timeslots = generateTimeSlots(startTime, endTime);

      const newCita = {
        uid: uuidv4(),
        date: selectedDay[0].date,
        month: new Date(2023, new Date().getMonth() + selectedDay[0].monthOffset)
          .toLocaleString('es-ES', { month: 'long' })
          .toLowerCase(),
        time: formatTime(selectedTime),
        therapyType: normalizedTherapyType,
        status: 'pending',
        proName: '',
        Timeslots,
      };

      setCitaGlobal(newCita);
      console.log('Nueva cita global:', newCita);

      if (collectionName === 'pros') {
        const proRef = doc(db, collectionName, currentUser.uid);
        const proSnap = await getDoc(proRef);

        if (!proSnap.exists()) {
          console.log(`El profesional no existe en la colección ${collectionName}.`);
          return;
        }

        const proData = proSnap.data();
        const existingHorarios = proData.horarios || {};

        // Construimos el objeto `updatedHorarios` con el nuevo formato
        const updatedHorarios = { ...existingHorarios };

        selectedDay.forEach((day) => {
          const monthName = new Date(2023, new Date().getMonth() + day.monthOffset)
            .toLocaleString('es-ES', { month: 'long' })
            .toLowerCase();

          if (!updatedHorarios[monthName]) {
            updatedHorarios[monthName] = [];
          }

          // Creamos primero el objeto con `timeSlots`
          const horarioObj = {
            Timeslots, // Primero se guarda timeSlots
            date: day.date, // Luego se guarda date
          };

          updatedHorarios[monthName].push(horarioObj);
        });

        await updateDoc(proRef, { horarios: updatedHorarios });
        console.log('Horarios actualizados en Firestore:', updatedHorarios);
      }

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Horarios confirmados correctamente.',
      });
      setIsConfirmed(true);
    } catch (error) {
      console.error('Error al confirmar horarios:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al confirmar los horarios.',
      });
    }
  };

  const handleEditHours = async () => {
    console.log('handleEditHours invoked, setting isConfirmed to false');
    setIsConfirmed(false);
  };

  const handleUpdateHours = async () => {
    console.log('handleUpdateHours invoked');
    try {
      const userRef = doc(db, collectionName, currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log(`El usuario no existe en la colección ${collectionName}.`);
        return;
      }

      const userData = userSnap.data();
      let existingCitas = userData.Citas || [];
      console.log('Existing citas before filtering for update:', existingCitas);
      existingCitas = removePendingCitas(existingCitas);
      console.log('Existing citas after filtering pending for update:', existingCitas);

      const citaIndex = existingCitas.findIndex((cita) => cita.uid === currentAppointmentId);
      console.log('Index of current appointment:', citaIndex);

      if (citaIndex === -1) {
        console.error('Cita no encontrada.');
        return;
      }

      const updatedCita = {
        ...existingCitas[citaIndex],
        date: selectedDay[0].date,
        month: new Date(2023, new Date().getMonth() + selectedDay[0].monthOffset)
          .toLocaleString('es-ES', { month: 'long' })
          .toLowerCase(),
        time: formatTime(selectedTime),
        status: 'edited',
      };

      const updatedCitas = [
        ...existingCitas.slice(0, citaIndex),
        updatedCita,
        ...existingCitas.slice(citaIndex + 1),
      ];

      console.log('Updated cita to be saved:', updatedCita);
      await updateDoc(userRef, { Citas: updatedCitas });
      console.log('Cita actualizada en Firestore:', updatedCita);

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Cita actualizada correctamente.',
      });
      setIsConfirmed(true);
    } catch (error) {
      console.error('Error al actualizar la cita:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al actualizar la cita.',
      });
    }
  };

  return {
    isConfirmed,
    handleConfirmHours,
    handleEditHours,
    handleUpdateHours,
  };
};

export default useConfirmation;
