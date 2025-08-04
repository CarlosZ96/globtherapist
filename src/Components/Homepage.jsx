/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect } from 'react';
import '../stylesheets/homepage.css';
import '../stylesheets/windo.css';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Globody from './Globody';
import Admin from './glob/admin';
import ProSpace from './ProSpace';
import Login from './windows/login';
import close from '../img/Closegt.png';
import Create from './windows/Create';
import CreatePro from './CreatePro';
import ProsCards from './windows/ProsCards';
import Dates from './Mydates/Dates';
import Who from './windows/Who';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';

const Homepage = () => {
  const {
    currentUser, logout, userData, currentPro,
  } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreatePro, setShowCreatePro] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [showWho, setShowWho] = useState(false);
  const [showPros, setShowPros] = useState(false);
  const globodyRef = React.useRef(null);
  const [appointmentsUpdated, setAppointmentsUpdated] = useState(false);

  const togglePros = () => setShowPros((prev) => !prev);
  const toggleWho = () => setShowWho((prev) => !prev);
  const toggleDates = () => setShowDates((prev) => !prev);
  const toggleLogin = () => setShowLogin((prev) => !prev);
  const toggleCreate = () => setShowCreate((prev) => !prev);
  const toggleCreatePro = () => setShowCreatePro((prev) => !prev);

  const noUserStyles = {
    homeWindows: { width: '70%' },
    logBtnCont: { position: 'relative', flexDirection: 'column' },
  };

  const userStyles = {
    homeWindows: { width: '78%' },
    logBtnCont: { position: 'relative' },
  };

  const pendingAppointmentsCount = currentPro
    ? (currentPro.MisCitas?.filter((cita) => cita.status === 'pay_pending').length || 0)
    : (userData?.Citas?.filter((cita) => cita.status === 'pay_pending').length || 0);

  const handleScheduleClick = () => {
    if (globodyRef.current) {
      globodyRef.current.scrollToTherapy();
    }
  };

  const renderContent = () => {
    if (currentPro) return <ProSpace />;
    if (userData?.role === 'admin') return <Admin />;
    return <Globody ref={globodyRef} onScheduleClick={handleScheduleClick} />;
  };

  // Función para normalizar hora (ej: "8:00am" -> "08:00")
  const normalizeTime = (timeStr) => {
    if (!timeStr) return null;

    const time = timeStr.toLowerCase().trim();
    const [hours, minutes] = time.replace(/[^0-9:]/g, '').split(':');
    let hoursInt = parseInt(hours, 10);

    if (time.includes('pm') && hoursInt !== 12) hoursInt += 12;
    if (time.includes('am') && hoursInt === 12) hoursInt = 0;

    return `${String(hoursInt).padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  // Función para verificar si una cita ya pasó
  const isAppointmentPast = (cita) => {
    try {
      // Mapeo de meses en español
      const monthMap = {
        enero: 0,
        febrero: 1,
        marzo: 2,
        abril: 3,
        mayo: 4,
        junio: 5,
        julio: 6,
        agosto: 7,
        septiembre: 8,
        octubre: 9,
        noviembre: 10,
        diciembre: 11,
      };

      // Obtener fecha y hora actual en Colombia (UTC-5)
      const now = new Date();
      const offsetColombia = -5 * 60; // UTC-5 en minutos
      const nowColombia = new Date(now.getTime() + offsetColombia * 60000);

      // Crear fecha de la cita
      const citaMonth = monthMap[cita.month.toLowerCase()];
      const citaDay = parseInt(cita.date, 10);
      const citaYear = nowColombia.getFullYear();

      // Normalizar hora de la cita
      const normalizedTime = normalizeTime(cita.time);
      if (!normalizedTime) return false;

      const [citaHours, citaMinutes] = normalizedTime.split(':').map(Number);

      // Crear objeto Date para la cita (en UTC-5)
      const citaDate = new Date(citaYear, citaMonth, citaDay, citaHours, citaMinutes);

      // Comparar con la hora actual en Colombia
      return citaDate < nowColombia;
    } catch (error) {
      console.error('Error verificando cita:', error);
      return false;
    }
  };

  // Función para actualizar citas pasadas
  const updatePastAppointments = async () => {
    if (!currentUser) return;

    try {
      // Determinar si es usuario o profesional
      const isPro = !!currentPro;
      const collectionName = isPro ? 'pros' : 'users';
      const citasField = isPro ? 'MisCitas' : 'Citas';

      // Obtener referencia al documento
      const docRef = doc(db, collectionName, currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const citas = data[citasField] || [];

        let needsUpdate = false;
        const updatedCitas = citas.map((cita) => {
          if ((cita.status === 'pending' || cita.status === 'pay_pending') && isAppointmentPast(cita)) {
            needsUpdate = true;
            return { ...cita, status: 'end' };
          }
          return cita;
        });

        if (needsUpdate) {
          await updateDoc(docRef, { [citasField]: updatedCitas });
          console.log('Citas pasadas actualizadas a "end"');

          // Recargar la página para reflejar cambios
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error actualizando citas pasadas:', error);
    }
  };

  // Verificar citas pasadas al cargar el componente y cuando cambia el usuario
  useEffect(() => {
    if (currentUser && !appointmentsUpdated) {
      updatePastAppointments();
      setAppointmentsUpdated(true);
    }

    // Resetear cuando el usuario cierre sesión
    if (!currentUser) {
      setAppointmentsUpdated(false);
    }
  }, [currentUser]);

  return (
    <div className="Home-Page">
      <header className="Home-Roof">
        <div className="Home-txt">
          <h1>GTH</h1>
        </div>
        <div
          className="Home-windows"
          style={currentUser ? userStyles.homeWindows : noUserStyles.homeWindows}
        >
          <button
            type="button"
            onClick={togglePros}
            className="text-button"
          >
            Especialistas
          </button>
          <button type="button" onClick={toggleWho} className="text-button">¿Quiénes somos?</button>
        </div>
        {!currentUser ? (
          <div className="Log-Btn-Cont" style={noUserStyles.logBtnCont}>
            <button
              type="button"
              className="Log-Btn"
              style={noUserStyles.logBtn}
              onClick={toggleLogin}
            >
              <h3 className="Log-Btn-txt">Loguearse</h3>
            </button>
            <button
              type="button"
              className="Log-Btn"
              style={noUserStyles.logBtn}
              onClick={toggleCreate}
            >
              <h3 className="Log-Btn-txt">Crear Cuenta</h3>
            </button>
          </div>
        ) : (
          <div className="Log-Btn-Cont" style={userStyles.logBtnCont}>
            {showNotification && (
              <span
                className="pending-dates"
              >
                {pendingAppointmentsCount}
              </span>
            )}
            <div className="Log-Btn-Cont-User">
              <button
                type="button"
                className="Log-Btn-user"
                onClick={() => {
                  toggleDates();
                  setShowNotification(false);
                }}
              >
                <h3 className="User-Name">
                  {currentPro?.username || userData?.username || 'Usuario'}
                </h3>
              </button>
            </div>
            <button
              type="button"
              className="Log-Btn"
              onClick={() => {
                setShowNotification(false);
                logout().then(() => window.location.reload());
              }}
            >
              <img src={close} alt="" />
            </button>
          </div>
        )}
      </header>
      {showWho && (
        <div className="modal-overlay" onClick={toggleWho}>
          <div className="modal-content-who" onClick={(e) => e.stopPropagation()}>
            <Who onClose={toggleWho} />
          </div>
        </div>
      )}
      {showDates && (
        <div className="modal-overlay">
          <div className="dates-modal-content">
            <button type="button" className="close-button-dates" onClick={toggleDates}>
              &times;
            </button>
            <Dates />
          </div>
        </div>
      )}
      {showPros && (
        <div className="modal-overlay" onClick={togglePros}>
          <div className="modal-content-procards" onClick={(e) => e.stopPropagation()}>
            <ProsCards onClose={togglePros} />
          </div>
        </div>
      )}
      {renderContent()}
      <div style={{ display: showLogin ? 'block' : 'none' }}>
        <Login toggleLogin={toggleLogin} />
      </div>
      <div style={{ display: showCreate ? 'block' : 'none' }}>
        <Create toggleCreate={toggleCreate} toggleCreatePro={toggleCreatePro} />
      </div>
      {showCreatePro && <CreatePro toggleCreatePro={toggleCreatePro} />}
    </div>
  );
};

export default Homepage;
