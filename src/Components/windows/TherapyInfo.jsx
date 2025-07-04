/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import PropTypes from 'prop-types';
import '../../stylesheets/procards.css';
import close from '../../img/Closegt.png';

const TherapyInfo = ({ therapyConfig, onClose }) => {
  if (!therapyConfig) return null;

  return (
    <div className="Create-overlay" onClick={onClose}>
      <div
        className="therapy-info-cont"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
          }
        }}
        role="button"
        tabIndex={0}
        style={{ backgroundColor: `${therapyConfig.color}` }}
      >
        <button
          type="button"
          className="therapy-close-button"
          onClick={onClose}
        >
          <img src={close} alt="Cerrar" />
        </button>

        <div className="therapy-info-title">
          <span className="therapy-icon">{therapyConfig.icon}</span>
          <h1>{therapyConfig.title}</h1>
        </div>

        <div className="therapy-info-text">
          <p>{therapyConfig.text}</p>
        </div>
      </div>
    </div>
  );
};

TherapyInfo.propTypes = {
  therapyConfig: PropTypes.shape({
    color: PropTypes.string,
    icon: PropTypes.string,
    text: PropTypes.string,
    title: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

TherapyInfo.defaultProps = {
  therapyConfig: null,
};

export default TherapyInfo;
