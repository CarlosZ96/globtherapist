/* eslint-disable no-dupe-keys */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { doc, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import '../../stylesheets/procards.css';
import close from '../../img/close.png';

const ProsCards = ({ onClose }) => {
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchHdvWithImages = async () => {
      const allowedIds = [
        'I0AULHKRBZYVAJ3JQ7rhWuBbxhe2',
        'X3JGiHJRFfNbUnThmXFvZWbsB1p2',
        '5sQCDthzpIerAeLVMN2lYiO41AE2',
      ];

      try {
        const proData = await Promise.all(allowedIds.map(async (proId) => {
          const snap = await getDoc(doc(db, 'pros', proId));
          if (!snap.exists()) return null;
          const data = snap.data();
          let imageUrl = null;
          try {
            const files = await listAll(ref(storage, `profileImages/${proId}`));
            if (files.items.length) {
              imageUrl = await getDownloadURL(files.items[0]);
            }
          } catch (e) {
            console.warn('No hay imagen para', proId);
          }

          return {
            id: proId,
            username: data.username,
            terapias: data.terapias,
            Hdv: data.Hdv || {},
            imageUrl,
          };
        }));

        setPros(proData.filter(Boolean));
      } catch (error) {
        console.error('Error cargando profesionales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHdvWithImages();
  }, []);

  const nextCard = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % pros.length);
  };

  const prevCard = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + pros.length) % pros.length);
  };

  if (loading) {
    return (
      <div className="ProsCards-cont">
        <p>Cargando profesionales...</p>
      </div>
    );
  }

  if (pros.length === 0) {
    return (
      <div className="ProsCards-cont">
        <button type="button" className="close-button" onClick={onClose}>
          <img src={close} alt="Cerrar" />
        </button>
        <p>No hay profesionales disponibles en este momento.</p>
      </div>
    );
  }

  const currentPro = pros[currentIndex];
  const hdv = currentPro.Hdv || {};

  // helpers para manejar ambos esquemas de 'terapias'
  const normalizeText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  };

  // mapeo para mostrar nombres legibles (en caso de que el name guardado esté normalizado)
  const displayNameFromNormalized = (norm) => {
    const map = {
      fisica: 'Física',
      fisíca: 'Física',
      fisíca: 'Física',
      lenguaje: 'Lenguaje',
      mental: 'Mental',
      ocupacional: 'Ocupacional',
    };
    return map[norm] || (norm ? `${norm.charAt(0).toUpperCase()}${norm.slice(1)}` : '');
  };

  const getTherapyName = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    // objeto: intentamos distintas propiedades
    if (item.name) {
      // si name está normalizado, devolvemos version amigable
      const n = normalizeText(item.name);
      const friendly = displayNameFromNormalized(n);
      return friendly || item.name;
    }
    if (item.Nombre) return item.Nombre;
    if (item.terapia) return item.terapia;
    return '';
  };

  return (
    <div className="ProsCards-cont">
      <button type="button" className="close-button-procrd" onClick={onClose}>
        <img src={close} alt="Cerrar" />
      </button>
      <div className="ProCard-cont">
        <div className="ProCard-sec1">
          <div className="proInfo-cont">
            {currentPro.imageUrl ? (
              <img
                src={currentPro.imageUrl}
                alt="Perfil profesional"
                className="profile-image"
              />
            ) : (
              <div className="profile-placeholder">Sin imagen</div>
            )}
            <h1>{currentPro.username || 'Profesional'}</h1>
            <h3>{hdv.profession || 'Profesión no especificada'}</h3>
          </div>
          <div className="proDescription-cont">
            <p>{hdv.professionalHistory || 'Historia profesional no disponible'}</p>
          </div>
        </div>
        <div className="ProCard-sec2">
          <div className="GlobProDescription-cont">
            <p>
              Profesional especializado/a en
              {' '}
              {hdv.specialization || 'su campo'}
              {' '}
              egresado en la universidad
              {' '}
              {hdv.university || 'no especificada'}
              {' '}
              con
              {' '}
              {hdv.yearsOfExperience || 'varios'}
              {' '}
              años de experiencia
            </p>
          </div>
          <div className="ProTeras-cont">
            <h2>Terapias Disponibles:</h2>
            <div className="ProTeras-list">
              <ul>
                {Array.isArray(currentPro.terapias) && currentPro.terapias.length > 0 ? (
                  currentPro.terapias.map((terapiaItem, idx) => {
                    const name = getTherapyName(terapiaItem);
                    const key = `${currentPro.id}-ter-${idx}-${normalizeText(name)}`;

                    return (
                      <li key={key}>
                        {name || 'Terapia'}
                      </li>
                    );
                  })
                ) : (
                  <li>No especificadas</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="carousel-controls">
        <button type="button" onClick={prevCard} disabled={pros.length <= 1}>‹</button>
        <span>
          {currentIndex + 1}
          {' '}
          -
          {' '}
          {pros.length}
        </span>
        <button type="button" onClick={nextCard} disabled={pros.length <= 1}>›</button>
      </div>
    </div>
  );
};
ProsCards.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ProsCards;
