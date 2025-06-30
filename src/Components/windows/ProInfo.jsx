import React from 'react';

const ProInfo = () => {
  return (
    <div className="date-info">
      <div>
        <h1>Tipo de Terapia</h1>
      </div>
      <div className="date-info-header-cont">
        <h1>Paciente:</h1>
        <h2>Nombre del Paciente</h2>
        <div className="date-time-cont">
          <div className="date-time">
            <input type="radio" name="time" id="time" />
            <h2>Primera vez</h2>
          </div>
          <input type="radio" name="time" id="time" />
          <h2>Seguimiento</h2>
        </div>
      </div>
      <div className="patient-info">
        <h2>Motivo de consulta:</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
      <div className="patient-state-cont">
        <div className="patient-states">
          <h2>Patient State:</h2>
          <div className="patient-states-items">
            <h3>state</h3>
            <h3>state</h3>
            <h3>state</h3>
            <h3>state</h3>
          </div>
        </div>
      </div>
      <div className="patient-symptoms">
        <h2>Síntomas:</h2>
        <div className="patient-symptoms">
          <p>aqui van el input</p>
        </div>
      </div>
      <div className="pro-management">
        <div className="pro-management-tecniques">
          <h2>Tecnicas usadas::</h2>
          <input type="radio" name="tec" id="tec" />
          <h3>Mindfulness</h3>
        </div>
      </div>
    </div>
  );
};

export default ProInfo;
