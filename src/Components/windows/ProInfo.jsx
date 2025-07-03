/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import PropTypes from 'prop-types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../stylesheets/proinfo.css';

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
  const [previousCitaInfo, setPreviousCitaInfo] = useState(null);
  const [showPreviousInfo, setShowPreviousInfo] = useState(false);

  useEffect(() => {
    const fetchPacienteData = async () => {
      try {
        const proDocRef = doc(db, 'pros', proId);
        const proDocSnap = await getDoc(proDocRef);

        if (!proDocSnap.exists()) {
          throw new Error('Profesional no encontrado');
        }

        const misCitas = proDocSnap.data().MisCitas || [];
        const cita = misCitas.find((c) => c.uid === citaUid);

        if (!cita) {
          throw new Error('Cita no encontrada');
        }

        if (cita.DateProInfo) {
          setDateProInfo(cita.DateProInfo || {});
        }

        setPaciente({
          name: cita.userName,
          description: cita.description,
          userId: cita.userId, // Guardamos el ID del usuario para buscar citas anteriores
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

  // Función para obtener la información de la cita anterior más reciente
  const fetchPreviousCitaInfo = async () => {
    try {
      if (!paciente || !paciente.userId) {
        Swal.fire('Información', 'No se encontró información del paciente.', 'info');
        return;
      }

      // Buscar en la colección de usuarios
      const userDocRef = doc(db, 'users', paciente.userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error('Usuario no encontrado');
      }

      // Obtener las citas del usuario
      const userCitas = userDocSnap.data().Citas || [];
      console.log('Citas del usuario:', userCitas);
      // Normalizar el tipo de terapia actual
      const normalizedCurrentTherapy = normalizeText(therapyType);

      // Filtrar citas del mismo tipo y que no sea la actual
      const citasFiltradas = userCitas.filter((cita) => {
        // Verificar que la cita tenga información
        if (!cita.DateProInfo || !cita.therapyType) return false;

        // Normalizar el tipo de terapia de la cita
        const normalizedCitaTherapy = normalizeText(cita.therapyType);
        console.log('tipo de terapia en la base de datos:', normalizedCitaTherapy);
        // Comparar los tipos normalizados
        return cita.uid !== citaUid
          && normalizedCitaTherapy === normalizedCurrentTherapy;
      });
      console.log('Citas filtradas:', citasFiltradas);
      console.log('tipo de terapia:', normalizedCurrentTherapy);

      // Ordenar por fecha (más reciente primero)
      citasFiltradas.sort((a, b) => {
        // Usar timestamps si están disponibles
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }

        // Alternativa: convertir fechas a objetos Date
        try {
          const dateA = new Date(`${a.date} ${a.month} ${a.year || new Date().getFullYear()}`);
          const dateB = new Date(`${b.date} ${b.month} ${b.year || new Date().getFullYear()}`);
          return dateB - dateA;
        } catch (e) {
          return 0;
        }
      });

      if (citasFiltradas.length === 0) {
        Swal.fire('Información', 'No se encontraron citas anteriores de este tipo de terapia.', 'info');
        return;
      }

      const citaMasReciente = citasFiltradas[0];

      setPreviousCitaInfo({
        date: citaMasReciente.date,
        month: citaMasReciente.month,
        time: citaMasReciente.time,
        data: citaMasReciente.DateProInfo,
      });
      setShowPreviousInfo(true);
    } catch (errore) {
      console.error('Error obteniendo cita anterior:', errore);
      Swal.fire('Error', 'No se pudo obtener la información de la cita anterior', 'error');
    }
  };

  const handleFieldChange = (field, value) => {
    setDateProInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedFieldChange = (parentField, field, value) => {
    setDateProInfo((prev) => {
      const prevObj = prev || {};
      return {
        ...prevObj,
        [parentField]: {
          ...(prevObj[parentField] || {}),
          [field]: value,
        },
      };
    });
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...dateProInfo[field]];
    newArray[index] = value;
    setDateProInfo((prev) => ({
      ...prev,
      [field]: newArray,
    }));
  };

  const addToArray = (field, defaultValue = '') => {
    setDateProInfo((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultValue],
    }));
  };

  const handleOptionChange = (field, value) => {
    setDateProInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveChanges = async () => {
    try {
      // Asegurarse de que dateProInfo no sea undefined
      const infoToSave = dateProInfo || {};
      // eslint-disable-next-line no-unused-vars
      const cleanInfoToSave = JSON.parse(JSON.stringify(dateProInfo));
      // 1. Actualizar citas del profesional
      const proDocRef = doc(db, 'pros', proId);
      const proDocSnap = await getDoc(proDocRef);

      if (proDocSnap.exists()) {
        const misCitas = proDocSnap.data().MisCitas || [];
        const updatedCitas = misCitas.map((cita) => {
          if (cita.uid === citaUid) {
            return {
              ...cita,
              DateProInfo: infoToSave,
            };
          }
          return cita;
        });

        await updateDoc(proDocRef, {
          MisCitas: updatedCitas,
        });
      }

      // 2. Actualizar citas del usuario
      if (paciente && paciente.userId) {
        const userDocRef = doc(db, 'users', paciente.userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userCitas = userDocSnap.data().Citas || [];
          const updatedUserCitas = userCitas.map((cita) => {
            if (cita.uid === citaUid) {
              return {
                ...cita,
                DateProInfo: infoToSave,
                // Mantener campos importantes
                userName: cita.userName,
                description: cita.description,
                therapyType: cita.therapyType,
                date: cita.date,
                month: cita.month,
                time: cita.time,
                createdAt: cita.createdAt,
                proName: cita.proName,
                status: cita.status,
              };
            }
            return cita;
          });

          await updateDoc(userDocRef, {
            Citas: updatedUserCitas,
          });
        }
      }

      Swal.fire('Guardado!', 'Los cambios se han guardado correctamente', 'success');
    } catch (errore) {
      console.error('Error guardando cambios:', errore);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    }
  };
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
                <div className="options-container">
                  {['Estable', 'Ansioso', 'Deprimido', 'Irritable'].map((option) => (
                    <div key={option} className="option-item">
                      <input
                        type="radio"
                        name="estadoAnimico"
                        id={`estado-${option}`}
                        checked={dateProInfo.estadoAnimico === option}
                        onChange={() => handleOptionChange('estadoAnimico', option)}
                      />
                      <label htmlFor={`estado-${option}`}>{option}</label>
                    </div>
                  ))}
                  <div className="option-item">
                    <input
                      type="radio"
                      name="estadoAnimico"
                      id="estado-otro"
                      checked={dateProInfo.estadoAnimico === 'Otro'}
                      onChange={() => handleOptionChange('estadoAnimico', 'Otro')}
                    />
                    <label htmlFor="estado-otro">Otro:</label>
                    <input
                      type="text"
                      value={dateProInfo.estadoAnimicoOtro || ''}
                      onChange={(e) => handleFieldChange('estadoAnimicoOtro', e.target.value)}
                      disabled={dateProInfo.estadoAnimico !== 'Otro'}
                    />
                  </div>
                </div>
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
                <div className="options-container">
                  <div className="marcha-options">
                    <h3>Marcha:</h3>
                    {['Normal', 'Alterada'].map((option) => (
                      <div key={option} className="option-item">
                        <input
                          type="radio"
                          name="marcha"
                          id={`marcha-${option}`}
                          checked={dateProInfo.marcha === option}
                          onChange={() => handleFieldChange('marcha', option)}
                        />
                        <label htmlFor={`marcha-${option}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                  <div className="ayudas-option">
                    <label>Uso de ayudas:</label>
                    <input
                      type="text"
                      value={dateProInfo.usoAyudas || ''}
                      onChange={(e) => handleFieldChange('usoAyudas', e.target.value)}
                    />
                  </div>
                </div>
              </div>
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
                <div className="options-container">
                  {['Adecuada', 'Dificultad leve', 'Dificultad severa'].map((option) => (
                    <div key={option} className="option-item">
                      <input
                        type="radio"
                        name="comprension"
                        id={`comprension-${option}`}
                        checked={dateProInfo.comprension === option}
                        onChange={() => handleOptionChange('comprension', option)}
                      />
                      <label htmlFor={`comprension-${option}`}>{option}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="patient-symptoms">
              <h2>Expresión verbal:</h2>
              <div className="options-container">
                {['Normal', 'Tartamudez', 'Omisión palabras'].map((option) => (
                  <div key={option} className="option-item">
                    <input
                      type="radio"
                      name="expresionVerbal"
                      id={`expresion-${option}`}
                      checked={dateProInfo.expresionVerbal === option}
                      onChange={() => handleOptionChange('expresionVerbal', option)}
                    />
                    <label htmlFor={`expresion-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
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
                <div className="options-container">
                  {['Independiente', 'Supervisado', 'Asistido'].map((option) => (
                    <div key={option} className="option-item">
                      <input
                        type="radio"
                        name="independencia"
                        id={`independencia-${option}`}
                        checked={dateProInfo.nivelDeIndependencia === option}
                        onChange={() => handleOptionChange('nivelDeIndependencia', option)}
                      />
                      <label htmlFor={`independencia-${option}`}>{option}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="patient-symptoms">
              <h2>Destrezas motoras finas:</h2>
              <div className="options-container">
                <div className="option-item">
                  <input
                    type="checkbox"
                    id="coordinacion-optima"
                    checked={dateProInfo.coordinacionOptima || false}
                    onChange={(e) => handleFieldChange('coordinacionOptima', e.target.checked)}
                  />
                  <label htmlFor="coordinacion-optima">Coordinación óptima</label>
                </div>
                <div className="option-item">
                  <label>Dificultad en:</label>
                  <input
                    type="text"
                    value={dateProInfo.dificultadEn || ''}
                    onChange={(e) => handleFieldChange('dificultadEn', e.target.value)}
                    disabled={dateProInfo.coordinacionOptima}
                  />
                </div>
              </div>
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

  // Función para renderizar la información de la cita anterior
  const renderPreviousInfoModal = () => {
    if (!showPreviousInfo || !previousCitaInfo) return null;

    return (
      <div
        className="previous-info-modal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1002,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{
          width: '80%',
          maxWidth: '700px',
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          overflow: 'auto',
          maxHeight: '90vh',
          position: 'relative',
        }}
        >
          <button
            type="button"
            onClick={() => setShowPreviousInfo(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
          <h2>Información de Cita Anterior</h2>
          <p>
            <strong>Fecha:</strong>
            {' '}
            {previousCitaInfo.date}
            {' '}
            de
            {' '}
            {previousCitaInfo.month}
            {' '}
            a las
            {' '}
            {previousCitaInfo.time}
          </p>

          <h3>Datos Clínicos:</h3>
          <div style={{ marginTop: '10px' }}>
            {Object.entries(previousCitaInfo.data).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '15px' }}>
                <strong>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  :
                </strong>
                {Array.isArray(value) ? (
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    {value.map((item, index) => (
                      <li key={typeof item === 'string' || typeof item === 'number' ? item : `${JSON.stringify(item)}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : typeof value === 'object' ? (
                  <div style={{ paddingLeft: '20px' }}>
                    {Object.entries(value).map(([subKey, subValue]) => (
                      <div key={subKey}>
                        <strong>
                          {subKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                          :
                        </strong>
                        {' '}
                        {subValue}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>
                    {' '}
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
      {renderPreviousInfoModal()}

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
              type="radio"
              name="time"
              id=""
            />
            <h2>Primera vez</h2>
          </div>
          <div className="date-time">
            <input
              type="radio"
              name="time"
              id=""
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

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          type="button"
          onClick={saveChanges}
          className="save-button"
        >
          Guardar Cambios
        </button>
        <button
          type="button"
          onClick={fetchPreviousCitaInfo}
          className="save-button"
          style={{ backgroundColor: '#2196F3' }}
        >
          Ver Cita Anterior
        </button>
      </div>
    </div>
  );
};

ProInfo.propTypes = {
  therapyType: PropTypes.string.isRequired,
  citaUid: PropTypes.string.isRequired,
  proId: PropTypes.string.isRequired,
};

export default ProInfo;
