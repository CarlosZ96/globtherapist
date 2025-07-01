/* eslint-disable radix */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import PropTypes from 'prop-types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../stylesheets/proinfo.css';

// Función para normalizar texto (igual que en Therapy)
const normalizeText = (text) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const ProInfo = ({ therapyType, citaUid, proId }) => {
  const [paciente, setPaciente] = useState(null);
  const [dateProInfo, setDateProInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPacienteData = async () => {
      try {
        // Obtener datos del profesional
        const proDocRef = doc(db, 'pros', proId);
        const proDocSnap = await getDoc(proDocRef);

        if (!proDocSnap.exists()) {
          throw new Error('Profesional no encontrado');
        }

        // Buscar la cita específica
        const misCitas = proDocSnap.data().MisCitas || [];
        const cita = misCitas.find((c) => c.uid === citaUid);

        if (!cita) {
          throw new Error('Cita no encontrada');
        }

        // Obtener DateProInfo si existe
        if (cita.DateProInfo) {
          setDateProInfo(cita.DateProInfo);
        }

        setPaciente({
          name: cita.userName,
          description: cita.description,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error obteniendo datos del paciente:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPacienteData();
  }, [citaUid, proId]);

  // Función para manejar cambios en los campos
  const handleFieldChange = (field, value) => {
    setDateProInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Función para manejar cambios en campos anidados
  const handleNestedFieldChange = (parentField, field, value) => {
    setDateProInfo((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value,
      },
    }));
  };

  // Función para manejar arrays
  const handleArrayChange = (field, index, value) => {
    const newArray = [...dateProInfo[field]];
    newArray[index] = value;
    setDateProInfo((prev) => ({
      ...prev,
      [field]: newArray,
    }));
  };

  // Función para agregar elementos a arrays
  const addToArray = (field, defaultValue = '') => {
    setDateProInfo((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultValue],
    }));
  };

  // Función para guardar cambios en Firestore
  const saveChanges = async () => {
    try {
      const proDocRef = doc(db, 'pros', proId);
      const proDocSnap = await getDoc(proDocRef);

      if (proDocSnap.exists()) {
        const misCitas = proDocSnap.data().MisCitas || [];
        const updatedCitas = misCitas.map((cita) => {
          if (cita.uid === citaUid) {
            return { ...cita, DateProInfo: dateProInfo };
          }
          return cita;
        });

        await updateDoc(proDocRef, {
          MisCitas: updatedCitas,
        });

        Swal.fire('Guardado!', 'Los cambios se han guardado correctamente', 'success');
      }
    } catch (errore) {
      console.error('Error guardando cambios:', errore);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    }
  };

  // Función para renderizar campos según el tipo de terapia
  const renderTherapyFields = () => {
    if (!dateProInfo) return null;

    const normalizedType = normalizeText(therapyType);

    switch (normalizedType) {
      case 'mental':
        return (
          <>
            <div className="patient-state-cont">
              <div className="patient-states">
                <h2>Estado anímico:</h2>
                <input
                  type="text"
                  value={dateProInfo.estadoAnimico || ''}
                  onChange={(e) => handleFieldChange('estadoAnimico', e.target.value)}
                />
              </div>
            </div>
            <div className="patient-symptoms">
              <h2>Síntomas:</h2>
              <textarea
                value={dateProInfo.sintomas || ''}
                onChange={(e) => handleFieldChange('sintomas', e.target.value)}
              />
            </div>
            <div className="pro-management">
              <div className="pro-management-tecniques">
                <h2>Técnicas usadas: </h2>
                <div className="techniques-list">
                  {dateProInfo.tecnicasUsadas?.map((tecnica, index) => (
                    <div key={tecnica ? `${tecnica}-${index}` : index}>
                      <input
                        type="text"
                        value={tecnica}
                        onChange={(e) => handleArrayChange('tecnicasUsadas', index, e.target.value)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addToArray('tecnicasUsadas')}
                    className="add-button"
                  >
                    + Agregar técnica
                  </button>
                </div>
              </div>
            </div>
          </>
        );

      case 'fisica':
        return (
          <>
            <div className="patient-state-cont">
              <div className="patient-states">
                <h2>Movilidad observada:</h2>
                <input
                  type="text"
                  value={dateProInfo.movilidadObservada || ''}
                  onChange={(e) => handleFieldChange('movilidadObservada', e.target.value)}
                />
              </div>
            </div>
            <div className="patient-symptoms">
              <h2>Rango articular:</h2>
              <input
                type="text"
                value={dateProInfo.rangoArticula || ''}
                onChange={(e) => handleFieldChange('rangoArticula', e.target.value)}
              />
            </div>
            <div className="pro-management">
              <div className="pro-management-tecniques">
                <h2>Escala de dolor: </h2>
                <div>
                  <label>Localización:</label>
                  <input
                    type="text"
                    value={dateProInfo.escalaDeDolor?.localizacion || ''}
                    onChange={(e) => handleNestedFieldChange('escalaDeDolor', 'localizacion', e.target.value)}
                  />
                </div>
                <div>
                  <label>Intensidad (0-10):</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={dateProInfo.escalaDeDolor?.intensidad || 0}
                    onChange={(e) => handleNestedFieldChange('escalaDeDolor', 'intensidad', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="pro-results-cont">
              <h2>Ejercicios realizados:</h2>
              <div className="exercises-list">
                {dateProInfo.ejerciciosRealizados?.map((ejercicio, index) => (
                  <div key={ejercicio ? `${ejercicio}-${index}` : index}>
                    <input
                      type="text"
                      value={ejercicio}
                      onChange={(e) => handleArrayChange('ejerciciosRealizados', index, e.target.value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addToArray('ejerciciosRealizados')}
                  className="add-button"
                >
                  + Agregar ejercicio
                </button>
              </div>
            </div>
          </>
        );

      case 'lenguaje':
        return (
          <>
            <div className="patient-state-cont">
              <div className="patient-states">
                <h2>Comprensión:</h2>
                <textarea
                  value={dateProInfo.comprension || ''}
                  onChange={(e) => handleFieldChange('comprension', e.target.value)}
                />
              </div>
            </div>
            <div className="patient-symptoms">
              <h2>Expresión verbal:</h2>
              <textarea
                value={dateProInfo.expresionVerbal || ''}
                onChange={(e) => handleFieldChange('expresionVerbal', e.target.value)}
              />
            </div>
            <div className="pro-management">
              <div className="pro-management-tecniques">
                <h2>Ejercicios realizados: </h2>
                <div className="exercises-list">
                  {dateProInfo.ejerciciosRealizados?.map((ejercicio, index) => (
                    <div key={ejercicio ? `${ejercicio}-${index}` : index}>
                      <input
                        type="text"
                        value={ejercicio}
                        onChange={(e) => handleArrayChange('ejerciciosRealizados', index, e.target.value)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addToArray('ejerciciosRealizados')}
                    className="add-button"
                  >
                    + Agregar ejercicio
                  </button>
                </div>
              </div>
            </div>
            <div className="pro-results-cont">
              <h2>Denominación:</h2>
              <input
                type="text"
                value={dateProInfo.denominacion || ''}
                onChange={(e) => handleFieldChange('denominacion', e.target.value)}
              />
            </div>
          </>
        );

      case 'ocupacional':
        return (
          <>
            <div className="patient-state-cont">
              <div className="patient-states">
                <h2>Nivel de independencia:</h2>
                <input
                  type="text"
                  value={dateProInfo.nivelDeIndependencia || ''}
                  onChange={(e) => handleFieldChange('nivelDeIndependencia', e.target.value)}
                />
              </div>
            </div>
            <div className="patient-symptoms">
              <h2>Destrezas motoras finas:</h2>
              <input
                type="text"
                value={dateProInfo.destrezasMotorasFinas || ''}
                onChange={(e) => handleFieldChange('destrezasMotorasFinas', e.target.value)}
              />
            </div>
            <div className="pro-management">
              <div className="pro-management-tecniques">
                <h2>Ejercicios realizados: </h2>
                <div className="exercises-list">
                  {dateProInfo.ejerciciosRealizados?.map((ejercicio, index) => (
                    <div key={ejercicio ? `${ejercicio}-${index}` : index}>
                      <input
                        type="text"
                        value={ejercicio}
                        onChange={(e) => handleArrayChange('ejerciciosRealizados', index, e.target.value)}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addToArray('ejerciciosRealizados')}
                    className="add-button"
                  >
                    + Agregar ejercicio
                  </button>
                </div>
              </div>
            </div>
            <div className="pro-results-cont">
              <h2>Adaptaciones sugeridas:</h2>
              <div>
                <label>Hogar:</label>
                <input
                  type="text"
                  value={dateProInfo.adaptacionesSugeridas?.hogar || ''}
                  onChange={(e) => handleNestedFieldChange('adaptacionesSugeridas', 'hogar', e.target.value)}
                />
              </div>
              <div>
                <label>Trabajo:</label>
                <input
                  type="text"
                  value={dateProInfo.adaptacionesSugeridas?.trabajo || ''}
                  onChange={(e) => handleNestedFieldChange('adaptacionesSugeridas', 'trabajo', e.target.value)}
                />
              </div>
            </div>
          </>
        );

      default:
        return <p>No se ha definido un formulario para este tipo de terapia.</p>;
    }
  };

  if (loading) return <div className="loading-info">Cargando información del paciente...</div>;
  if (error) {
    return (
      <div className="error-info">
        Error:
        {' '}
        {error}
      </div>
    );
  }

  return (
    <div className="date-info">
      <div className="date-info-theratype">
        <h1>{therapyType.toLowerCase()}</h1>
      </div>
      <div className="date-info-header-cont">
        <div className="date-patient-name-cont">
          <h2>Paciente:</h2>
          <h3>{paciente?.name || 'Nombre no disponible'}</h3>
        </div>
        <div className="date-time-cont">
          <div className="date-time">
            <input
              type="checkbox"
              name="time"
              id="time"
            />
            <h2>Primera vez</h2>
          </div>
          <div className="date-time">
            <input
              type="checkbox"
              name="time"
              id="time"
            />
            <h2>Seguimiento</h2>
          </div>
        </div>
      </div>
      <div className="patient-info">
        <h2>Motivo de consulta:</h2>
        <p>{paciente?.description || 'Descripción no disponible'}</p>
      </div>

      {renderTherapyFields()}

      <div className="pro-results-cont">
        <h2>Recomendaciones:</h2>
        <textarea
          value={dateProInfo?.recomendaciones || ''}
          onChange={(e) => handleFieldChange('recomendaciones', e.target.value)}
          placeholder="Escribe aquí las recomendaciones para el paciente..."
          rows="4"
        />
      </div>

      <button
        type="button"
        onClick={saveChanges}
        className="save-button"
      >
        Guardar Cambios
      </button>
    </div>
  );
};

ProInfo.propTypes = {
  therapyType: PropTypes.string.isRequired,
  citaUid: PropTypes.string.isRequired,
  proId: PropTypes.string.isRequired,
};

export default ProInfo;
