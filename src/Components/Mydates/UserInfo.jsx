/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../AuthContext';
import { auth, db } from '../../firebase';
import submit from '../../img/submit.png';
import clock from '../../img/clock.png';
import StatusBrick from '../payments/StatusBrick';
import '../../stylesheets/userInfo.css';

const UserInfo = ({ citas, title, emptyMessage }) => {
  const navigate = useNavigate();
  const { setCitaGlobal } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const [userData, setuserData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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

  const handlePaymentClick = (cita) => {
    if (cita.payment && cita.payment.paymentId) {
      setSelectedPayment({
        id: cita.payment.paymentId,
        amount: cita.payment.amount,
        method: cita.payment.method,
        status: cita.payment.status,
      });
      setShowPaymentModal(true);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

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
          <div
            key={cita.id}
            className={`cita-card ${cita.status === 'end' ? 'completed-cita' : ''}`}
          >
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
                <button
                  type="button"
                  className={`status-${cita.status} status-button`}
                  onClick={() => handlePaymentClick(cita)}
                >
                  <img src={clock} alt="" className="payment-im" />
                  {cita.status === 'pay_pending' ? 'Pago Pendiente'
                    : cita.status === 'pending' ? 'Pendiente' : 'Finalizada'}
                </button>
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

      {/* Modal para mostrar el estado del pago */}
      {showPaymentModal && selectedPayment && (
        <StatusBrick
          paymentDetails={selectedPayment}
          onClose={closePaymentModal}
          onRetry={() => {
            console.log('Reintentar pago implementaría nueva lógica de pago');
            closePaymentModal();
          }}
        />
      )}
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
      payment: PropTypes.shape({
        paymentId: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        method: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
      }),
    }),
  ),
  title: PropTypes.string,
  emptyMessage: PropTypes.string,
};

export default UserInfo;
