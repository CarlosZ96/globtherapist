/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import '../stylesheets/windo.css';

const CreatePro = ({ toggleCreatePro }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    document: { type: 'C.C', number: '' },
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    therapies: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const therapyOptions = ['Mental', 'Física', 'Ocupacional', 'Lenguaje'];
  const normalizeText = (text) => {
    return text
      .normalize('NFD') // Normaliza caracteres con tildes
      .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
      .toLowerCase(); // Convierte a minúsculas
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
    setFormData((prev) => ({
      ...prev,
      therapies: prev.therapies.includes(therapy)
        ? prev.therapies.filter((t) => t !== therapy)
        : [...prev.therapies, therapy],
    }));
  };

  const validateForm = () => {
    const validationErrors = {};
    if (!formData.fullName.trim()) {
      validationErrors.fullName = 'El nombre completo es obligatorio.';
    }
    if (!formData.username.trim()) {
      validationErrors.username = 'El nombre de usuario es obligatorio.';
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      validationErrors.email = 'Por favor, ingresa un correo válido.';
    }
    if (!formData.document.number.trim()) {
      validationErrors.documentNumber = 'El número de documento es obligatorio.';
    }
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

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const { user } = userCredential;
      const normalizedTherapies = formData.therapies.map((therapy) => normalizeText(therapy));

      await setDoc(doc(db, 'pros', user.uid), {
        uid: user.uid,
        Nombre: formData.fullName,
        username: formData.username,
        Documento: formData.document,
        email: formData.email,
        telefono: formData.phone,
        terapias: normalizedTherapies,
        horarios: [],
      });

      alert('Cuenta Pro creada con éxito');
      setFormData({
        fullName: '',
        username: '',
        document: { type: 'C.C', number: '' },
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        therapies: [],
      });
      toggleCreatePro();
    } catch (error) {
      console.error('Error creando Pro:', error);
      alert('Hubo un error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="CreatePro-overlay">
      <div className="CreatePro-cont">
        <form className="CreatePro-body" onSubmit={handleSubmit}>
          <h1>Crea tu cuenta Pro</h1>
          <div className="CreatePro-input-cont">
            <label>Nombre Completo:</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'input-error' : ''}
            />
            {errors.fullName && <p className="error-text">{errors.fullName}</p>}
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
            {errors.username && <p className="error-text">{errors.username}</p>}
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
              <p className="error-text">{errors.documentNumber}</p>
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
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div className="CreatePro-input-cont">
            <label>Teléfono:</label>
            <input
              type="number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
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
            {errors.password && <p className="error-text">{errors.password}</p>}
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
              <p className="error-text">{errors.confirmPassword}</p>
            )}
          </div>
          <div className="CreatePro-therapies">
            <label>¿Con qué terapias vas a trabajar?</label>
            <div className="therapy-buttons">
              {therapyOptions.map((therapy) => (
                <button
                  key={therapy}
                  type="button"
                  className={
                    formData.therapies.includes(therapy) ? 'active' : ''
                  }
                  onClick={() => toggleTherapy(therapy)}
                >
                  {therapy}
                </button>
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
