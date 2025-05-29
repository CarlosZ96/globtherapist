import React from 'react';
import PropTypes from 'prop-types';
import close from '../../img/Closegt.png';

const Who = ({ onClose }) => {
  return (
    <div className="WhoIm-cont">
      <button
        type="button"
        className="close-button-who"
        onClick={onClose}
      >
        <img src={close} alt="Cerrar" />
      </button>

      <div className="Who-title-cont">
        <h1>GLOBTHERAPIST</h1>
      </div>
      <div>
        <p>
          Somos un puente innovador entre pacientes y profesionales de la salud.
          Nuestra plataforma conecta a personas que buscan bienestar integral con
          terapeutas certificados en fisioterapia, salud mental, terapia ocupacional y lenguaje,
          a través de videollamadas seguras y accesibles desde cualquier lugar.
        </p>
      </div>
    </div>
  );
};
Who.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default Who;
