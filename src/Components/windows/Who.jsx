import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { collection, getDoc } from 'firebase/firestore';
import close from '../../img/Closegt.png';
import '../../stylesheets/windo.css';
import { db } from '../../firebase';

const Who = ({ onClose }) => {
  const [pros, setPros] = useState([]);

  useEffect(() => {
    const fetchPublicPros = async () => {
      try {
        // IDs de los profesionales públicos
        const publicProIds = ['I0AULHKRBZYVAJ3JQ7rhWuBbxhe2',
          'V5zxUoV4SrZYVyX1QA79UovUCVG2', '5sQCDthzpIerAeLVMN2lYiO41AE2'];

        // Obtener documentos específicos
        const prosSnapshot = await getDoc(
          collection(db, 'pros'),
        );

        const publicPros = [];
        prosSnapshot.forEach((doc) => {
          if (publicProIds.includes(doc.id)) {
            publicPros.push({
              id: doc.id,
              ...doc.data(),
            });
          }
        });

        setPros(publicPros);
      } catch (error) {
        console.error('Error fetching public professionals:', error);
      }
    };

    fetchPublicPros();
  }, []);

  return (
    <div className="WhoIm-cont">
      <button type="button" className="close-button-who" onClick={onClose}>
        <img src={close} alt="Cerrar" />
      </button>

      <div className="Who-title-cont">
        <h1>GLOBTHERAPIST</h1>
      </div>

      <div className="Who-txt-cont">
        <p>
          Somos un puente innovador entre pacientes y profesionales de la salud.
          Nuestra plataforma conecta a personas que buscan bienestar integral con
          terapeutas certificados en fisioterapia, salud mental, terapia ocupacional y lenguaje,
          a través de videollamadas seguras y accesibles desde cualquier lugar.
        </p>
      </div>

      <div className="featured-pros">
        <div className="pros-grid">
          {pros.map((pro) => (
            <div key={pro.id} className="pro-card">
              <h3>{pro.Nombre || pro.username}</h3>
              <p>{pro.profesion || 'Profesional de salud'}</p>
              <p>
                Especialidades:
                {pro.terapias?.join(', ') || 'Terapias varias'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
Who.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default Who;
