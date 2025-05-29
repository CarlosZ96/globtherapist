import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  collection, getDocs,
} from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import close from '../../img/Closegt.png';

const ProsCards = ({ onClose }) => {
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchRandomPros = async () => {
      try {
        // Obtener todos los profesionales
        const q = collection(db, 'pros');
        const querySnapshot = await getDocs(q);
        const allPros = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Seleccionar hasta 3 aleatorios
        const shuffled = allPros.sort(() => 0.5 - Math.random());
        const selectedPros = shuffled.slice(0, Math.min(3, shuffled.length));

        // Para cada profesional, obtener la URL de la imagen
        const prosWithImages = await Promise.all(selectedPros.map(async (pro) => {
          const imageRef = ref(storage, `profileImages/${pro.id}`);
          try {
            const files = await listAll(imageRef);
            if (files.items.length > 0) {
              const url = await getDownloadURL(files.items[0]);
              return { ...pro, imageUrl: url };
            }
          } catch (error) {
            console.error('Error obteniendo imagen: ', error);
          }
          return { ...pro, imageUrl: null };
        }));

        setPros(prosWithImages);
        setLoading(false);
      } catch (error) {
        console.error('Error obteniendo profesionales: ', error);
        setLoading(false);
      }
    };

    fetchRandomPros();
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
        <button type="button" className="close-button" onClick={onClose}>
          <img src={close} alt="Cerrar" />
        </button>
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

  return (
    <div className="ProsCards-cont">
      <button type="button" className="close-button" onClick={onClose}>
        <img src={close} alt="Cerrar" />
      </button>

      <div className="ProCard-cont">
        <div className="proInfo-cont">
          <h1>{currentPro.username || 'Profesional'}</h1>
          {currentPro.imageUrl ? (
            <img
              src={currentPro.imageUrl}
              alt="Perfil profesional"
              className="profile-image"
            />
          ) : (
            <div className="profile-placeholder">Sin imagen</div>
          )}
          <h3>{hdv.profession || 'Profesión no especificada'}</h3>
        </div>

        <div className="proDescription-cont">
          <p>{hdv.professionalHistory || 'Historia profesional no disponible'}</p>
        </div>

        <div className="GlobProDescription-cont">
          <p>
            Profesional especializado/a en
            {' '}
            {hdv.specialization || 'su campo'}
            egresado en la universidad
            {' '}
            {hdv.university || 'no especificada'}
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
              {currentPro.terapias?.map((terapia) => (
                <li key={`${currentPro.id}-${terapia}`}>{terapia}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Controles del carrusel */}
      <div className="carousel-controls">
        <button type="button" onClick={prevCard} disabled={pros.length <= 1}>‹</button>
        <span>
          {currentIndex + 1}
          {' '}
          /
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
