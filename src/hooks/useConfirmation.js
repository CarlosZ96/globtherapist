/* eslint-disable no-plusplus */
import { useState } from 'react';
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

  const handleConfirmHours = async () => {
    if (!selectedDay.length) {
      alert('Por favor, selecciona al menos un día.');
      return;
    }

    try {
      const userRef = doc(db, collectionName, currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error('El usuario no existe en Firestore.');
        return;
      }

      // Normalizar el tipo de terapia
      const normalizedTherapyType = therapyType
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '');

      const appointments = selectedDay.map((day) => {
        const monthIndex = new Date().getMonth() + day.monthOffset;
        const monthName = new Date(2023, monthIndex).toLocaleString('es-ES', { month: 'long' }).toLowerCase();

        return {
          date: day.date,
          month: monthName,
          time: collectionName === 'users' ? formatTime(selectedTime) : formatTime(startTime),
          therapyType: normalizedTherapyType, // Usar el valor normalizado
        };
      });

      if (typeof onDateSelection === 'function') {
        onDateSelection(appointments);
      }

      if (collectionName === 'pros') {
        const userData = userSnap.data();
        const existingHorarios = userData.horarios || {};

        selectedDay.forEach((day) => {
          const monthIndex = new Date().getMonth() + day.monthOffset;
          const monthName = new Date(2023, monthIndex).toLocaleString('es-ES', { month: 'long' }).toLowerCase();

          const timeslots = [];
          for (let hour = startTime; hour < endTime; hour++) {
            const startHourFormatted = formatTime(hour);
            const endHourFormatted = formatTime(hour + 1);
            timeslots.push(`${startHourFormatted}-${endHourFormatted}`);
          }

          const newDay = {
            date: day.date,
            Timeslots: timeslots,
          };

          if (existingHorarios[monthName]) {
            const existingDays = existingHorarios[monthName];
            const existingDayIndex = existingDays.findIndex((d) => d.date === newDay.date);

            if (existingDayIndex !== -1) {
              existingDays[existingDayIndex].Timeslots = [
                ...existingDays[existingDayIndex].Timeslots,
                ...newDay.Timeslots,
              ];
            } else {
              existingHorarios[monthName].push(newDay);
            }
          } else {
            existingHorarios[monthName] = [newDay];
          }
        });

        await updateDoc(userRef, { horarios: existingHorarios });
        console.log('Horarios guardados en Firestore:', existingHorarios);
      } else if (collectionName === 'users') {
        const userData = userSnap.data();
        const existingCitas = userData.Citas || [];
        const newCita = {
          date: selectedDay[0].date,
          month: new Date(2023, new Date().getMonth() + selectedDay[0].monthOffset)
            .toLocaleString('es-ES', { month: 'long' })
            .toLowerCase(),
          time: formatTime(selectedTime),
          therapyType: normalizedTherapyType,
          status: 'pending',
        };
        const updatedCitas = [...existingCitas, newCita];
        await updateDoc(userRef, { Citas: updatedCitas });
        console.log('Cita guardada en Firestore:', newCita);
      }

      alert('Horarios confirmados correctamente.');
      setIsConfirmed(true);
    } catch (error) {
      console.error('Error al confirmar horarios:', error);
    }
  };
  const handleEditHours = async () => {
    try {
      const userRef = doc(db, collectionName, currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log(`El usuario no existe en la colección ${collectionName}.`);
        return;
      }

      await updateDoc(userRef, { horarios: {} });
      console.log('Horarios eliminados.');
      setIsConfirmed(false);
    } catch (error) {
      console.error('Error al eliminar horarios:', error);
    }
  };

  return {
    isConfirmed,
    handleConfirmHours,
    handleEditHours,
  };
};

export default useConfirmation;
