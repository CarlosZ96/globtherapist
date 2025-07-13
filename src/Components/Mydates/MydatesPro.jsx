import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import '../../stylesheets/userInfo.css';

const MydatesPro = ({ citas }) => {
  const navigate = useNavigate();
  const { setCitaGlobal } = useAuth();

  if (!citas || citas.length === 0) {
    return <div className="no-citas">No hay citas programadas</div>;
  }

  return (
    <div className="user-citas-container">
      <div className="user-win-name-cont">
        <h1>Citas de Pacientes</h1>
      </div>
      <div className="citas-cont">
        {citas.map((cita) => (
          <div
            key={cita.id}
            className={`cita-card ${cita.status === 'end' ? 'completed-cita' : ''}`}
          >
            <div className="cita-info">
              <div className="cita-field-date">
                <p>{cita.month}</p>
                <p>{cita.date}</p>
              </div>
              <div className="cita-pro-cont">
                <p className="cita-pro-name">
                  {cita.userName}
                </p>
              </div>
              <div className="cita-time-cont">
                <p className="cita-time">
                  {cita.time}
                </p>
              </div>
              <button
                type="button"
                className="status-button"
                onClick={() => {
                  setCitaGlobal({
                    uid: cita.uid,
                    startTime: cita.time,
                    date: Number(cita.date),
                    month: cita.month,
                    therapyType: cita.therapyType,
                    description: cita.description,
                    status: cita.status,
                    proName: cita.userName,
                  });
                  navigate('/meeting', {
                    state: {
                      cita: {
                        uid: cita.uid,
                        startTime: cita.time,
                        date: Number(cita.date),
                        month: cita.month,
                      },
                      collection: 'pros',
                    },
                  });
                }}
              >
                Ir a la reunión
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

MydatesPro.propTypes = {
  citas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      month: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      therapyType: PropTypes.string.isRequired,
      userName: PropTypes.string.isRequired,
      userEmail: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
};

MydatesPro.defaultProps = {
  citas: [],
};

export default MydatesPro;
