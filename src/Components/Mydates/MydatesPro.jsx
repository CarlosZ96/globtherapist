import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const MydatesPro = ({ citas }) => {
  const navigate = useNavigate();
  const { setCitaGlobal } = useAuth();

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
            onClick={() => {
              // Actualizamos el contexto global con la información de la cita
              setCitaGlobal({
                uid: cita.uid,
                startTime: cita.time,
                date: Number(cita.date),
                month: cita.month,
                therapyType: cita.therapyType,
                description: cita.description,
                status: cita.status,
                proName: cita.userName, // En este caso, el nombre del paciente (o como se requiera)
              });
              // Navegamos a /meeting con los datos necesarios
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
      description: PropTypes.string,
    }),
  ),
};

MydatesPro.defaultProps = {
  citas: [],
};

export default MydatesPro;
