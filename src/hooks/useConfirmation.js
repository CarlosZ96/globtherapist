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
    if (!selectedDay.length || (collectionName === 'pros' && (startTime === undefined || endTime === undefined))) {
      alert('Por favor, selecciona al menos un día y define un horario válido.');
      return;
    }

    try {
      const userRef = doc(db, collectionName, currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error('El profesional no existe en Firestore.');
        return;
      }

      // Obtener los horarios existentes o inicializar un objeto vacío
      const userData = userSnap.data();
      const existingHorarios = userData.horarios || {};

      // Iterar sobre todos los días seleccionados
      selectedDay.forEach((day) => {
        // Obtener el mes actual basado en el monthOffset
        const monthIndex = new Date().getMonth() + day.monthOffset;
        const monthName = new Date(2023, monthIndex).toLocaleString('es-ES', { month: 'long' }).toLowerCase();

        // Generar los Timeslots dinámicamente
        const timeslots = [];
        for (let hour = startTime; hour < endTime; hour++) {
          const startHourFormatted = formatTime(hour);
          const endHourFormatted = formatTime(hour + 1);
          timeslots.push(`${startHourFormatted}-${endHourFormatted}`);
        }

        // Crear el objeto para el día seleccionado
        const newDay = {
          date: day.date,
          Timeslots: timeslots,
        };

        // Si el mes ya existe, agregar el nuevo día al array del mes
        if (existingHorarios[monthName]) {
          const existingDays = existingHorarios[monthName];
          const existingDayIndex = existingDays.findIndex((d) => d.date === newDay.date);

          // Si el día ya existe, actualizar sus Timeslots
          if (existingDayIndex !== -1) {
            existingDays[existingDayIndex].Timeslots = [
              ...existingDays[existingDayIndex].Timeslots,
              ...newDay.Timeslots,
            ];
          } else {
            // Si el día no existe, agregarlo al array del mes
            existingHorarios[monthName].push(newDay);
          }
        } else {
          // Si el mes no existe, crear un nuevo array con el día seleccionado
          existingHorarios[monthName] = [newDay];
        }
      });

      // Guardar los horarios actualizados en Firestore
      await updateDoc(userRef, { horarios: existingHorarios });

      console.log('Horarios guardados en Firestore:', existingHorarios);
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

      // Eliminar todos los horarios
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
