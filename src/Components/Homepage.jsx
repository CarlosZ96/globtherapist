/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState } from 'react';
import '../stylesheets/homepage.css';
import '../stylesheets/windo.css';
import Globody from './Globody';
import Admin from './admin';
import ProSpace from './ProSpace';
import Login from './windows/login';
import close from '../img/Closegt.png';
import Create from './windows/Create';
import CreatePro from './CreatePro';
import Dates from './Mydates/Dates';
import { useAuth } from '../AuthContext';

const Homepage = () => {
  const {
    currentUser, logout, userData, currentPro,
  } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreatePro, setShowCreatePro] = useState(false);
  const [showDates, setShowDates] = useState(false); // Nuevo estado para controlar la modal

  // Nuevo toggle para las citas
  const toggleDates = () => {
    setShowDates((prev) => !prev);
  };

  const toggleLogin = () => {
    setShowLogin((prev) => !prev);
  };

  const toggleCreate = () => {
    setShowCreate((prev) => !prev);
  };

  const toggleCreatePro = () => {
    setShowCreatePro((prev) => !prev);
  };

  const renderContent = () => {
    if (currentPro) {
      return <ProSpace />;
    }
    if (userData?.role === 'admin') {
      return <Admin />;
    }
    return <Globody />;
  };

  return (
    <div className="Home-Page">
      <header className="Home-Roof">
        <div className="Home-txt"><h1>GTH</h1></div>
        <div className="Home-windows">
          <h2>Especialistas</h2>
          <h2>¿Quiénes somos?</h2>
        </div>
        {!currentUser ? (
          <div className="Log-Btn-Cont">
            <button type="button" className="Log-Btn" onClick={toggleLogin}>
              <h3>Loguearse</h3>
            </button>
            <button type="button" className="Log-Btn" onClick={toggleCreate}>
              <h3>Crear Cuenta</h3>
            </button>
          </div>
        ) : (
          <div className="Log-Btn-Cont">
            <div className="Log-Btn-Cont-User">
              <button
                type="button"
                className="Log-Btn-user"
                onClick={toggleDates}
              >
                <h3 className="User-Name">
                  {currentPro?.username || userData?.username || 'Usuario'}
                </h3>
              </button>
            </div>
            <button type="button" className="Log-Btn" onClick={logout}>
              <img src={close} alt="" />
            </button>
          </div>
        )}
      </header>
      {showDates && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              type="button"
              className="close-button"
              onClick={toggleDates}
            >
              &times;
            </button>
            <Dates />
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
