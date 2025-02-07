/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../AuthContext';
import '../../stylesheets/windo.css';

const Login = ({ toggleLogin }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const formRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      toggleLogin();
    } catch (err) {
      setError('Contraseña Incorrecta. Intenta de nuevo.');
      console.error(err);
    }
  };

  const handleClose = () => {
    toggleLogin();
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="Login-overlay">
      <div className="Log-cont" ref={formRef}>
        <form className="Login-body" onSubmit={handleSubmit}>
          <div className="Login-title-cont">
            <h1>Iniciar sesión</h1>
            <div
              className="close-button"
              onClick={handleClose}
            >
              &times;
            </div>
          </div>
          <div className="Login-input-cont">
            <h3>Correo:</h3>
            <input
              type="email"
              name="email"
              className={`Login-input ${error ? 'input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="Login-input-cont">
            <h3>Contraseña:</h3>
            <input
              type="password"
              name="password"
              className={`Login-input ${error ? 'input-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="Login-submit-cont">
            <button type="submit">
              <h3>Confirmar</h3>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

Login.propTypes = {
  toggleLogin: PropTypes.func.isRequired,
};

export default Login;
