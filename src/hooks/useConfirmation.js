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

      // 🔍 Verifica que los valores sean correctos
      console.log('selectedDay:', selectedDay);
      console.log('startTime:', startTime);
      console.log('endTime:', endTime);
      console.log('formatted startTime:', formatTime(startTime));
      console.log('formatted endTime:', formatTime(endTime));

      const newHorarios = selectedDay.map(({ date, monthOffset }) => {
        const monthIndex = new Date().getMonth() + monthOffset;
        const calculatedMonthName = new Date(2023, monthIndex).toLocaleString('es-ES', { month: 'long' });

        return {
          date,
          month: calculatedMonthName.toLowerCase(),
          startTime: formatTime(startTime) || 'Hora inválida',
          endTime: formatTime(endTime) || 'Hora inválida',
          status: 'available',
        };
      }).filter((h) => h.startTime !== 'Hora inválida' && h.endTime !== 'Hora inválida');

      if (!newHorarios.length) {
        console.error('Error: No se generaron horarios válidos.');
        return;
      }

      const userData = userSnap.data();
      const prevHorarios = Array.isArray(userData.horarios) ? userData.horarios : [];
      const updatedHorarios = [...prevHorarios, ...newHorarios];

      await updateDoc(userRef, { horarios: updatedHorarios });

      console.log('Horarios guardados en Firestore:', updatedHorarios);
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

      const horariosKey = collectionName === 'pros' ? 'horarios' : 'Citas';
      await updateDoc(userRef, { [horariosKey]: [] });
      console.log(`${horariosKey} eliminados.`);
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
