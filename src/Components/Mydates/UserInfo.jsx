import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const UserInfo = ({ citas }) => {
  const navigate = useNavigate();

  if (!citas || citas.length === 0) {
    return <div className="no-citas">No tienes citas programadas</div>;
  }

  return (
    <div className="user-citas-container">
      <div className="user-win-name-cont">
        <h1>Tus Citas</h1>
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
              <span className="cita-label">Profesional:</span>
              {cita.proName}
            </p>
          </div>
          <button
            type="button"
            className="reunion-btn"
            onClick={() => navigate('/meeting', {
                state: { cita, collection: 'users' },
              })}
          >
            Ir a la reunión
          </button>
        </div>
      ))}
    </div>
  );
};

UserInfo.defaultProps = {
  citas: [],
};

UserInfo.propTypes = {
  citas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      month: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      therapyType: PropTypes.string.isRequired,
      proName: PropTypes.string.isRequired,
    }),
  ),
};

export default UserInfo;
