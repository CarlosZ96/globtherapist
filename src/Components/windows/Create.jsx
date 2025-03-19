import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import '../../stylesheets/windo.css';
import { auth, db } from '../../firebase';

const Create = ({ toggleCreate, toggleCreatePro }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    userName: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const formRef = useRef();

  const validateForm = () => {
    const validationErrors = {};
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      validationErrors.email = 'Por favor, ingresa un correo válido.';
    }
    if (formData.password.length < 6) {
      validationErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (formData.confirmPassword !== formData.password) {
      validationErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }
    return validationErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const { user } = userCredential;

      // Guardar datos del usuario en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: formData.userName,
        email: formData.email,
        telefono: formData.phone,
        Citas: [],
        role: 'usuario',
      });

      await setDoc(doc(db, 'mail', user.uid), {
        to: formData.email,
        message: {
          subject: '¡Bienvenido a GlobTherapist!',
          text: `Hola ${formData.userName}, te damos la bienvenida a GlobTherapist. Gracias por registrarte.`,
          html: `<p>Hola <strong>${formData.userName}</strong>,</p>
                 <p>Bienvenido a nuestra GlobTherapist. Gracias por registrarte.</p>`,
        },
      });

      Swal.fire({
        title: '¡Éxito!',
        text: 'Usuario creado con éxito.',
        icon: 'success',
        customClass: {
          popup: 'mi-popup',
          title: 'mi-titulo',
          content: 'mi-contenido',
          confirmButton: 'mi-boton-confirmar',
        },
        buttonsStyling: false,
      });

      setFormData({
        email: '',
        phone: '',
        userName: '',
        password: '',
        confirmPassword: '',
      });
      toggleCreate();
    } catch (error) {
      console.error('Error creando el usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al crear el usuario.',
      });
    }
  };

  const handleClose = () => {
    toggleCreate();
    setFormData({
      email: '',
      phone: '',
      userName: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  // Función para cerrar la ventana actual y abrir la de cuenta pro
  const handleShowCreatePro = () => {
    toggleCreate(); // Cierra la ventana de crear usuario
    toggleCreatePro(); // Abre la ventana de crear cuenta Pro
  };
  // Función para mostrar la información usando Swal
  const mostrarInfoPro = () => {
    Swal.fire({
      title: '¿Eres profesional de la salud?',
      html: `
        <p>Si eres profesional y te gustaría trabajar con nosotros, puedes registrarte y brindar tus servicios de terapias en línea.</p>
        <button id="crear-cuenta-pro" type="button" class="swal2-confirm swal2-styled">Crear Cuenta Pro</button>
      `,
      showConfirmButton: false,
      didOpen: () => {
        const btn = document.getElementById('crear-cuenta-pro');
        btn.addEventListener('click', () => {
          Swal.close(); // Cierra la alerta de Swal
          handleShowCreatePro();
        });
      },
    });
  };

  return (
    <div className="Create-overlay">
      <div className="Create-cont" ref={formRef}>
        <form className="Create-body" onSubmit={handleSubmit}>
          <div className="Create-title-cont">
            <h1>Crear Usuario</h1>
            <div
              className="close-button"
              role="button"
              tabIndex="0"
              onClick={handleClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClose();
              }}
            >
              &times;
            </div>
          </div>
          <div className="Log-input-cont">
            <h3>Correo:</h3>
            <input
              type="email"
              name="email"
              className={`Create-input ${errors.email ? 'input-error' : ''}`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div className="Log-input-cont">
            <h3>Teléfono:</h3>
            <input
              type="number"
              name="phone"
              className="Create-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="Log-input-cont">
            <h3>Nombre de Usuario:</h3>
            <input
              type="text"
              name="userName"
              className="Create-input"
              value={formData.userName}
              onChange={handleChange}
            />
          </div>
          <div className="Log-input-cont">
            <h3>Contraseña:</h3>
            <input
              type="password"
              name="password"
              className={`Create-input ${errors.password ? 'input-error' : ''}`}
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <div className="Log-input-cont">
            <h3>Confirmar Contraseña:</h3>
            <input
              type="password"
              name="confirmPassword"
              className={`Create-input ${errors.confirmPassword ? 'input-error' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword}</p>
            )}
          </div>
          <div className="create-submit-cont">
            <button type="submit">
              <h3>Confirmar</h3>
            </button>
          </div>
          <div className="Create-pro-popup">
            <h4>¿Eres profesional de la salud?</h4>
            <button type="button" onClick={mostrarInfoPro}>
              Saber más
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

Create.propTypes = {
  toggleCreate: PropTypes.func.isRequired,
  toggleCreatePro: PropTypes.func.isRequired,
};

export default Create;
