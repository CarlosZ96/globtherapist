import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import clock from '../../img/clock.png'; // Importamos el icono del reloj
import submit from '../../img/submit.png'; // Importamos el icono de submit
import '../../stylesheets/userInfo.css';

const MydatesPro = ({ citas, title, emptyMessage }) => {
  const navigate = useNavigate();
  const { setCitaGlobal } = useAuth();

  if (!citas || citas.length === 0) {
    return (
      <div className="user-citas-container">
        <h2>{title}</h2>
        <div className="no-citas">{emptyMessage}</div>
      </div>
    );
  }

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'pay_pending': return 'Pago Pendiente';
      case 'pending': return 'Pendiente';
      case 'end': return 'Finalizada';
      default: return status;
    }
  };

  return (
    <div className="user-citas-container">
      <div className="user-win-name-cont">
        <h1>{title}</h1>
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
              {/* Contenedor de estado (solo lectura) */}
              <div className="cita-status">
                <div className={`status-${cita.status} status-display`}>
                  <img src={clock} alt="" className="payment-im" />
                  {getStatusText(cita.status)}
                </div>
              </div>
            </div>
            {/* Botón de reunión solo para citas pendientes */}
            {(cita.status === 'pay_pending' || cita.status === 'pending') && (
              <button
                type="button"
                className="reunion-btn"
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
                <img src={submit} alt="Ir a reunión" />
              </button>
            )}
            {/* Badge para citas finalizadas */}
            {cita.status === 'end' && (
              <div className="completed-badge">✓</div>
            )}
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
  title: PropTypes.string,
  emptyMessage: PropTypes.string,
};

MydatesPro.defaultProps = {
  citas: [],
  title: 'Citas de Pacientes',
  emptyMessage: 'No hay citas programadas',
};

export default MydatesPro;
