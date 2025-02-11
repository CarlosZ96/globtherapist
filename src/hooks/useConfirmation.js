/* eslint-disable no-plusplus */
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);

  const removePendingCitas = (citas) => {
    return citas.filter((cita) => cita.status !== 'pending');
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
      const userRef = doc(db, collectionName, currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error('El usuario no existe en Firestore.');
        return;
      }
      console.log('User data fetched:', userSnap.data());

      // Normalizamos el therapyType (para usuarios, se remueven espacios)
      const normalizedTherapyType = collectionName === 'users'
        ? therapyType
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '')
        : null;
      console.log('Normalized therapyType:', normalizedTherapyType);

      // Se crea un arreglo de citas basado en los días seleccionados
      const appointments = selectedDay.map((day) => {
        const monthIndex = new Date().getMonth() + day.monthOffset;
        const monthName = new Date(2023, monthIndex).toLocaleString('es-ES', { month: 'long' }).toLowerCase();
        const timeToUse = collectionName === 'users' ? formatTime(selectedTime) : formatTime(startTime);
        console.log('Appointment for day:', {
          date: day.date, month: monthName, time: timeToUse, therapyType: normalizedTherapyType,
        });
        return {
          date: day.date,
          month: monthName,
          time: timeToUse,
          therapyType: normalizedTherapyType,
        };
      });

      console.log('Appointments to save:', appointments);
      if (typeof onDateSelection === 'function') {
        onDateSelection(appointments);
      }

      if (collectionName === 'pros') {
        // Si fuera la colección 'pros', se ejecutaría otra lógica (no modificada aquí)
        console.log('Collection is "pros": se omite el guardado de cita para usuarios.');
      } else if (collectionName === 'users') {
        const userData = userSnap.data();
        let existingCitas = userData.Citas || [];
        console.log('Existing citas before filtering:', existingCitas);
        existingCitas = removePendingCitas(existingCitas);
        console.log('Existing citas after filtering pending:', existingCitas);

        const newCita = {
          uid: uuidv4(),
          date: selectedDay[0].date,
          month: new Date(2023, new Date().getMonth() + selectedDay[0].monthOffset)
            .toLocaleString('es-ES', { month: 'long' })
            .toLowerCase(),
          time: formatTime(selectedTime),
          therapyType: normalizedTherapyType,
          status: 'pending',
        };

        console.log('New cita to be added:', newCita);
        const updatedCitas = [...existingCitas, newCita];
        console.log('Updated citas:', updatedCitas);
        await updateDoc(userRef, { Citas: updatedCitas });
        console.log('Cita guardada en Firestore:', newCita);
        setCurrentAppointmentId(newCita.uid);
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
    setIsConfirmed(false); // Permite la edición al desconfirmar
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
