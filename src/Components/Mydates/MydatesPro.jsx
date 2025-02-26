import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const MydatesPro = ({ citas }) => {
  const navigate = useNavigate();

  if (!citas || citas.length === 0) {
    return <div className="no-citas">No hay citas programadas</div>;
  }

  return (
    <div className="pro-citas-container">
      <div className="pro-win-name-cont">
        <h1>Citas de Pacientes</h1>
      </div>

      {citas.map((cita) => (
        <div key={cita.id} className="cita-card">
          <div className="cita-info">
            <p className="cita-field">
              <span className="cita-label">Fecha:</span>
              {cita.date}
              {' '}
              de
              {cita.month}
            </p>
            <p className="cita-field">
              <span className="cita-label">Hora:</span>
              {cita.time}
            </p>
            <p className="cita-field">
              <span className="cita-label">Estado:</span>
              <span className={`status-${cita.status}`}>
                {cita.status === 'pending' ? 'Pendiente' : cita.status}
              </span>
            </p>
            <p className="cita-field">
              <span className="cita-label">Tipo de terapia:</span>
              {cita.therapyType}
            </p>
            <p className="cita-field">
              <span className="cita-label">Paciente:</span>
              {cita.userName}
            </p>
            <p className="cita-field">
              <span className="cita-label">Descripción:</span>
              {cita.description}
            </p>
            <p className="cita-field">
              <span className="cita-label">Email:</span>
              {cita.userEmail}
            </p>
          </div>
          <button
            type="button"
            className="reunion-btn"
            onClick={() => navigate('/meeting', {
                state: { cita, collection: 'pros' },
              })}
          >
            Ir a la reunión
          </button>
        </div>
      ))}
    </div>
  );
};

MydatesPro.propTypes = {
  citas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      month: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      therapyType: PropTypes.string.isRequired,
      userName: PropTypes.string.isRequired,
      userEmail: PropTypes.string.isRequired,
    }),
  ),
};

MydatesPro.defaultProps = {
  citas: [],
};

export default MydatesPro;
