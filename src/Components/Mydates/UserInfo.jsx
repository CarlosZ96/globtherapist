/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import { auth, db } from '../../firebase';
import submit from '../../img/submit.png';
import '../../stylesheets/userInfo.css';

const UserInfo = ({ citas, title, emptyMessage }) => {
  const navigate = useNavigate();
  const { setCitaGlobal } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const [userData, setuserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const { uid } = user;
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setuserData(userSnap.data().username);
        } else {
          console.log('No se encontró el usuario en Firestore');
        }
      }
    };

    fetchUserData();
  }, []);

  if (!citas || citas.length === 0) {
    return (
      <div className="user-citas-container">
        <h2>{title}</h2>
        <div className="no-citas">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="user-citas-container">
      <h2>{title}</h2>
      <div className="citas-cont">
        {citas.map((cita) => (
          <div key={cita.id} className="cita-card">
            <div className="cita-info">
              <div className="cita-field-date">
                <p>
                  {cita.month}
                  {' '}
                  {cita.date}
                </p>
              </div>
              <div className="cita-pro-cont">
                <p className="cita-pro-name">
                  {cita.proName}
                </p>
              </div>
              <div className="cita-time-cont">
                <p className="cita-time">
                  {cita.time}
                </p>
              </div>
              <div className="cita-status">
                <p className={`status-${cita.status}`}>
                  {cita.status === 'pay_pending' ? 'Pago Pendiente'
                   : cita.status === 'pending' ? 'Pendiente' : 'Finalizada'}
                </p>
              </div>
            </div>
            {cita.status === 'pay_pending' || cita.status === 'pending' ? (
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
                    proName: cita.proName,
                  });
                  navigate('/meeting', {
                    state: {
                      cita: {
                        uid: cita.uid,
                        startTime: cita.time,
                        date: Number(cita.date),
                        month: cita.month,
                      },
                      collection: 'users',
                    },
                  });
                }}
              >
                <img src={submit} alt="Ir a reunión" />
              </button>
            ) : (
              <div className="completed-badge">✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

UserInfo.defaultProps = {
  citas: [],
  title: 'Citas',
  emptyMessage: 'No tienes citas programadas',
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
      description: PropTypes.string,
    }),
  ),
  title: PropTypes.string,
  emptyMessage: PropTypes.string,
};

export default UserInfo;
