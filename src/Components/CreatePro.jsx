/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Swal from 'sweetalert2';
import { renderToStaticMarkup } from 'react-dom/server';
import { auth, db } from '../firebase';
import WelcomeEmail from './mails/WelcomeEmail';
import '../stylesheets/windo.css';

const initialFormData = {
  fullName: '',
  username: '',
  document: { type: 'C.C', number: '' },
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  therapies: [],
};

const CreatePro = ({ toggleCreatePro }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [therapyPrices, setTherapyPrices] = useState({}); // { 'Mental': '50000', ... }
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const emailHtml = renderToStaticMarkup(
    <WelcomeEmail userName={formData.fullName} collection="pros" />,
  );
  const therapyOptions = ['Mental', 'Física', 'Ocupacional', 'Lenguaje'];

  const normalizeText = (text) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'documentType' || name === 'documentNumber') {
      setFormData((prev) => ({
        ...prev,
        document: {
          ...prev.document,
          [name === 'documentType' ? 'type' : 'number']: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleTherapy = (therapy) => {
    setFormData((prev) => {
      const exists = prev.therapies.includes(therapy);
      const newTherapies = exists
        ? prev.therapies.filter((t) => t !== therapy)
        : [...prev.therapies, therapy];

      // if we deselect, remove price for that therapy
      if (exists) {
        setTherapyPrices((prevPrices) => {
          const copy = { ...prevPrices };
          delete copy[therapy];
          return copy;
        });
      }

      return {
        ...prev,
        therapies: newTherapies,
      };
    });
  };

  const handlePriceChange = (therapy, value) => {
    // allow empty string to let user clear, otherwise keep numeric string
    // remove leading zeros and spaces
    const sanitized = value === '' ? '' : value.replace(/[^0-9]/g, '');
    setTherapyPrices((prev) => ({ ...prev, [therapy]: sanitized }));
  };

  const validateForm = () => {
    const validationErrors = {};

    if (!formData.fullName.trim()) {
      validationErrors.fullName = 'Este campo es obligatorio.';
    }
    if (!formData.username.trim()) {
      validationErrors.username = 'Este campo es obligatorio.';
    }
    if (!formData.email.trim()) {
      validationErrors.email = 'Este campo es obligatorio.';
    } else if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      validationErrors.email = 'Por favor, ingresa un correo válido.';
    }
    if (!formData.document.number.trim()) {
      validationErrors.documentNumber = 'Este campo es obligatorio.';
    }
    if (!formData.phone.trim()) {
      validationErrors.phone = 'Este campo es obligatorio.';
    }

    // Validaciones específicas
    if (formData.password.length < 6) {
      validationErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Si hay terapias seleccionadas, validar que tengan precio numérico
    if (formData.therapies.length > 0) {
      const missingPrices = formData.therapies.filter((t) => {
        const val = therapyPrices[t];
        return val === undefined || val === null || val === '' || Number.isNaN(Number(val));
      });
      if (missingPrices.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Falta precio',
          text: `Debes ingresar un precio numérico para: ${missingPrices.join(', ')}`,
        });
        return;
      }
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const { user } = userCredential;

      // construir array de terapias como subarray de objetos { name: normalized, price: number }
      const normalizedTherapies = formData.therapies.map((therapy) => ({
        name: normalizeText(therapy),
        price: Number(therapyPrices[therapy] || 0),
      }));

      await setDoc(doc(db, 'pros', user.uid), {
        uid: user.uid,
        Nombre: formData.fullName,
        username: formData.username,
        Documento: formData.document,
        email: formData.email,
        telefono: formData.phone,
        terapias: normalizedTherapies,
        horarios: {},
        status: 'creado',
        validations: 3,
        createdAt: serverTimestamp(),
      });

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Cuenta Pro creada con éxito.',
      });
      setFormData(initialFormData);
      setTherapyPrices({});
      toggleCreatePro();
      await setDoc(doc(db, 'mail', user.uid), {
        to: formData.email,
        message: {
          subject: '¡Bienvenido a GlobTherapist!',
          text: `Hola ${formData.fullName}, te damos la bienvenida a GlobTherapist.`,
          html: emailHtml,
        },
      });
    } catch (error) {
      console.error('Error creando Pro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al crear la cuenta.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setTherapyPrices({});
    setErrors({});
    toggleCreatePro();
  };

  return (
    <div className="Login-overlay">
      <div className="CreatePro-cont">
        <form className="CreatePro-body" onSubmit={handleSubmit}>
          <div className="Create-title-cont">
            <h1>Crear cuenta</h1>
            <div className="close-button-crtp" onClick={handleClose}>
              &times;
            </div>
          </div>
          <div className="CreatePro-input-cont">
            <label>Nombre Completo:</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'input-error' : ''}
            />
            {errors.fullName && <p className="error-text-crtp">{errors.fullName}</p>}
          </div>
          <div className="CreatePro-input-cont">
            <label>Nombre de Usuario:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'input-error' : ''}
            />
            {errors.username && <p className="error-text-crtp">{errors.username}</p>}
          </div>
          <div className="CreatePro-input-cont">
            <label>Documento:</label>
            <select
              name="documentType"
              value={formData.document.type}
              onChange={handleChange}
            >
              <option value="C.C">C.C</option>
              <option value="C.E">C.E</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
            <input
              type="text"
              name="documentNumber"
              value={formData.document.number}
              onChange={handleChange}
              placeholder="Número"
              className={errors.documentNumber ? 'input-error' : ''}
            />
            {errors.documentNumber && (
              <p className="error-text-crtp">{errors.documentNumber}</p>
            )}
          </div>
          <div className="CreatePro-input-cont">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <p className="error-text-crtp">{errors.email}</p>}
          </div>
          <div className="CreatePro-input-cont">
            <label>Teléfono:</label>
            <input
              type="number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.documentNumber && (
              <p className="error-text-crtp">{errors.documentNumber}</p>
            )}
          </div>
          <div className="CreatePro-input-cont">
            <label>Contraseña:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <p className="error-text-crtp">{errors.password}</p>}
          </div>
          <div className="CreatePro-input-cont">
            <label>Confirmar Contraseña:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && (
              <p className="error-text-crtp">{errors.confirmPassword}</p>
            )}
          </div>
          <div className="CreatePro-therapies">
            <label>¿Con qué terapias vas a trabajar?</label>
            <div className="therapy-buttons">
              {therapyOptions.map((therapy) => (
                <div className="therapy-button-cont" key={therapy}>
                  <button
                    type="button"
                    className={`therapy-button ${formData.therapies.includes(therapy) ? 'therapy-button-active' : ''}`}
                    onClick={() => toggleTherapy(therapy)}
                  >
                    {therapy}
                  </button>
                  <div
                    className="therapy-price"
                    style={{ display: formData.therapies.includes(therapy) ? 'flex' : 'none' }}
                  >
                    <span>Precio por día:</span>
                    <input
                      className="price-input"
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={therapyPrices[therapy] ?? ''}
                      onChange={(e) => handlePriceChange(therapy, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="CreatePro-submit">
            <button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreatePro.propTypes = {
  toggleCreatePro: PropTypes.func.isRequired,
};

export default CreatePro;
