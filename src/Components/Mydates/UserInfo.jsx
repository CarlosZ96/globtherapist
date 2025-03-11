/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import { auth, db } from '../../firebase';
import '../../stylesheets/userInfo.css';

const UserInfo = ({ citas }) => {
  const navigate = useNavigate();
  const { setCitaGlobal } = useAuth();
  const [userData, setuserData] = useState(null);
  if (!citas || citas.length === 0) {
    return <div className="no-citas">No tienes citas programadas</div>;
  }
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

  return (
    <div className="user-citas-container">
      <div className="user-win-name-cont">
        {userData ? (
          <h1>
            {userData}
          </h1>
        ) : <h1>Cargando usuario...</h1>}
      </div>
      <div className="citas-cont">
        {citas.map((cita) => (
          <div key={cita.id} className="cita-card">
            <div className="cita-info">
              <div className="cita-field-date">
                <p>{cita.month}</p>
                <p>{cita.date}</p>
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
            </div>
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
              Ir
            </button>
          </div>
        ))}
      </div>
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
      description: PropTypes.string,
    }),
  ),
};

export default UserInfo;
