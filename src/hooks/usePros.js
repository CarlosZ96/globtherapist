import { useState } from 'react';
import {
  collection, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

const normalizeText = (text) => {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
  console.log(`normalizeText: "${text}" -> "${normalized}"`);
  return normalized;
};

const usePros = () => {
  const { citaGlobal } = useAuth();
  const [availablePros, setAvailablePros] = useState([]);
  const [selectedPro, setSelectedPro] = useState(null);
  const [selectedProId, setSelectedProId] = useState(null);

  const filterDates = async (currentUser, therapyType) => {
    try {
      if (!citaGlobal) {
        console.error('No hay cita seleccionada.');
        return;
      }

      const { month, date, time } = citaGlobal;
      console.log('Cita global:', { month, date, time });

      const prosCollectionRef = collection(db, 'pros');
      const prosQuerySnapshot = await getDocs(prosCollectionRef);
      const matchingPros = [];

      // Normalizar el therapyType
      const normalizedTherapyType = normalizeText(therapyType);
      console.log('therapyType normalizado:', normalizedTherapyType);

      prosQuerySnapshot.forEach((proDoc) => {
        const proData = proDoc.data();
        const { horarios, terapias, Nombre } = proData;
        console.log('Profesional:', Nombre);
        console.log('Terapias del profesional:', terapias);
        console.log('Horarios del profesional:', horarios);
        const normalizedTerapias = terapias?.map((t) => {
          const norm = normalizeText(t);
          return norm;
        });
        console.log('Terapias del profesional normalizadas:', normalizedTerapias);
        if (normalizedTerapias && normalizedTerapias.includes(normalizedTherapyType)) {
          console.log('El profesional ofrece la terapia:', therapyType);
          const monthHorarios = horarios?.[month];
          if (monthHorarios) {
            const dayHorario = monthHorarios.find((d) => d.date === date);
            if (dayHorario) {
              console.log(`Encontrado horario para el día ${date} en el mes ${month}`);
              const hasMatchingTime = dayHorario.Timeslots.some((timeSlot) => {
                const [startTimeStr] = timeSlot.split('-');
                console.log(`Comparando timeSlot: "${startTimeStr}" con time: "${time}"`);
                return startTimeStr === time;
              });

              if (hasMatchingTime) {
                console.log('Profesional coincide:', Nombre);
                matchingPros.push({ id: proDoc.id, name: Nombre });
              } else {
                console.log(`Ningún timeslot coincide para el profesional: ${Nombre}`);
              }
            } else {
              console.log(`No se encontró horario para la fecha ${date} en el mes ${month} para ${Nombre}`);
            }
          } else {
            console.log(`No hay horarios para el mes ${month} en ${Nombre}`);
          }
        } else {
          console.log(`El profesional ${Nombre} no ofrece la terapia normalizada: ${normalizedTherapyType}`);
        }
      });
      console.log('Profesionales encontrados:', matchingPros);
      setAvailablePros(matchingPros);
    } catch (error) {
      console.error('Error al obtener los profesionales:', error);
    }
  };

  return {
    availablePros,
    selectedPro,
    selectedProId,
    setSelectedPro,
    setSelectedProId,
    filterDates,
  };
};

export default usePros;
