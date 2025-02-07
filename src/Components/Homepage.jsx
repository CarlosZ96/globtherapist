import React, { useState } from 'react';
import '../stylesheets/homepage.css';
import '../stylesheets/windo.css';
import Globody from './Globody';
import Admin from './admin';
import ProSpace from './ProSpace';
import Login from './windows/login';
import Create from './windows/Create';
import CreatePro from './CreatePro';
import { useAuth } from '../AuthContext';

const Homepage = () => {
  const {
    currentUser, logout, userData, currentPro,
  } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreatePro, setShowCreatePro] = useState(false);

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
            <div>
              <h3>
                {currentPro?.username || userData?.username || 'Usuario'}
                {console.log(currentPro?.username || userData?.username)}
              </h3>
            </div>
            <button type="button" className="Log-Btn" onClick={logout}>
              <h3>Cerrar sesión</h3>
            </button>
          </div>
        )}
      </header>
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
