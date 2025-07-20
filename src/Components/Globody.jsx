import React, { forwardRef, useImperativeHandle, useState } from 'react';
import PropTypes from 'prop-types';
import med from '../img/HANIS 1.png';
import len from '../img/SyafriStudio 1.png';
import exe from '../img/exercise.png';
import bra from '../img/brain 1.png';
import cas from '../img/briefcase 1.png';
import Therapy from './Therapy';
import TherapyInfo from './windows/TherapyInfo';
import '../stylesheets/homepage.css';

const Globody = forwardRef((props, ref) => {
  const therapyRef = React.useRef(null);
  const [showTherapyInfo, setShowTherapyInfo] = useState(false);
  const [selectedTherapy, setSelectedTherapy] = useState(null);

  useImperativeHandle(ref, () => ({
    scrollToTherapy: () => {
      if (therapyRef.current) {
        therapyRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
  }));

  const therapyConfigs = {
    fisica: {
      color: '#EF5557',
      icon: '💪',
      text: 'Ejercicios personalizados adaptados a tus necesidades te ayudaremos a recuperar la movilidad y la fuerza.',
      title: 'Fisica',
    },
    lenguaje: {
      color: '#687AD7',
      icon: '💬',
      text: 'Te ayudamos a fortalecer tu comunicación, escucha y habla mediante prácticos y personalizados métodos.',
      title: 'Lenguaje',
    },
    mental: {
      color: '#38DDE3',
      icon: '🧠',
      text: 'Junto con un profesional exploraremos de manera segura tus pensamientos y experiencias para fortalecer tu bienestar emocional.',
      title: 'Mental',
    },
    ocupacional: {
      color: '#FFD904',
      icon: '💼',
      text: 'Te apoyaremos para que te desenvuelvas con confianza y eficiencia en tus actividades diarias (trabajo, hogar, autocuidado).',
      title: 'Ocupacional',
    },
  };

  const handleTherapyClick = (therapyType) => {
    setSelectedTherapy(therapyType);
    setShowTherapyInfo(true);
  };

  const closeTherapyInfo = () => {
    setShowTherapyInfo(false);
  };

  return (
    <div className="Home-body">
      {showTherapyInfo && (
        <TherapyInfo
          therapyConfig={therapyConfigs[selectedTherapy]}
          onClose={closeTherapyInfo}
        />
      )}
      <div className="GlobFront">
        <div className="GlobThera">
          <h1 className="Glob-title">GLOBTHERAPIST</h1>
          <div className="GlobThera-body">
            <div className="Glob-img-cont">
              <img src={med} alt="" className="Glob-img" />
            </div>
            <div className="Glob-txt-btn-conts">
              <div className="Glob-txt-cont">
                <p>Solicita tu cita en línea desde cualquier lugar.</p>
              </div>
              <div className="Glob-btn-cont">
                <button
                  type="button"
                  className="Glob-btn"
                  onClick={props.onScheduleClick}
                >
                  <h3>¡Agenda tu cita ahora!</h3>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="Theras-cont">
          <div className="Therapy">
            <h3 className="Therapy-title">Lenguaje</h3>
            <div className="Theras-body">
              <img src={len} alt="lenguaje" className="Theras-img" />
              <div className="Theras-btn-cont">
                <button
                  type="button"
                  className="Theras-btn"
                  onClick={() => handleTherapyClick('lenguaje')}
                >
                  <p>+</p>
                </button>
              </div>
            </div>
          </div>
          <div className="Therapy">
            <h3 className="Therapy-title">Fisica</h3>
            <div className="Theras-body">
              <img src={exe} alt="fisica" className="Theras-img" />
              <div className="Theras-btn-cont">
                <button
                  type="button"
                  className="Theras-btn"
                  onClick={() => handleTherapyClick('fisica')}
                >
                  <p>+</p>
                </button>
              </div>
            </div>
          </div>
          <div className="Therapy">
            <h3 className="Therapy-title">Mental</h3>
            <div className="Theras-body">
              <img src={bra} alt="mental" className="Theras-img" />
              <div className="Theras-btn-cont">
                <button
                  type="button"
                  className="Theras-btn"
                  onClick={() => handleTherapyClick('mental')}
                >
                  <p>+</p>
                </button>
              </div>
            </div>
          </div>
          <div className="Therapy">
            <h3 className="Therapy-title">Ocupacional</h3>
            <div className="Theras-body">
              <img src={cas} alt="ocupacional" className="Theras-img" />
              <div className="Theras-btn-cont">
                <button
                  type="button"
                  className="Theras-btn"
                  onClick={() => handleTherapyClick('ocupacional')}
                >
                  <p>+</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div ref={therapyRef}>
        <Therapy />
      </div>
    </div>
  );
});
Globody.propTypes = {
  onScheduleClick: PropTypes.func.isRequired,
};

Globody.displayName = 'Globody';

export default Globody;
