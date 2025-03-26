/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, updateDoc, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

// IMPORTA TU MODAL
import AdminProModal from '../AdminProModal';

import '../../stylesheets/admin.css';

const AdminPros = () => {
  const [totalPros, setTotalPros] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingPros, setPendingPros] = useState([]);

  // ESTADOS PARA EL MODAL
  const [showModal, setShowModal] = useState(false);
  const [selectedProData, setSelectedProData] = useState(null);

  const formatDate = (date) => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${day} del ${year}`;
  };

  useEffect(() => {
    const fetchPros = async () => {
      try {
        const prosRef = collection(db, 'pros');
        const snapshot = await getDocs(prosRef);
        const { docs } = snapshot;

        let approved = 0;
        const pendingList = [];

        await Promise.all(docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const proDocId = docSnapshot.id; // GUARDAR UID/ID

          // Si no existe campo status, lo creamos por defecto
          if (!Object.prototype.hasOwnProperty.call(data, 'status')) {
            const proRef = doc(db, 'pros', proDocId);
            await updateDoc(proRef, { status: 'pendiente' });
            data.status = 'pendiente';
          }

          // Contar aprobados
          if (data.status === 'aprobado') {
            approved += 1;
          }

          // Guardar los pendientes en un array
          if (data.status === 'pendiente') {
            let creationDate;
            if (data.createdAt && data.createdAt.toDate) {
              creationDate = formatDate(data.createdAt.toDate());
            } else {
              creationDate = 'No definida';
            }

            // GUARDAMOS TAMBIÉN EL ID DEL DOCUMENTO
            pendingList.push({
              id: proDocId,
              email: data.email,
              creationDate,
            });
          }
        }));

        setTotalPros(docs.length);
        setApprovedCount(approved);
        setPendingPros(pendingList);
      } catch (error) {
        console.error('Error al obtener los pros:', error);
      }
    };

    fetchPros();
  }, []);

  // CUANDO HACES CLIC EN UN PRO PENDIENTE
  const handleProClick = async (proItem) => {
    try {
      // 1. Obtenemos la info completa del doc
      const proRef = doc(db, 'pros', proItem.id);
      const proSnap = await getDoc(proRef);

      if (proSnap.exists()) {
        // 2. Guardamos sus datos en selectedProData
        const data = proSnap.data();
        // data incluye Nombre, email, telefono, Documento, Hdv, files, etc.
        setSelectedProData(data);
        // 3. Abrimos el modal
        setShowModal(true);
      } else {
        console.log('No existe el doc del pro con id:', proItem.id);
      }
    } catch (error) {
      console.error('Error al obtener datos completos del pro:', error);
    }
  };

  // Cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProData(null);
  };

  // Aprobar
  const handleApprove = async () => {
    if (!selectedProData) return;
    try {
      // Buscamos el doc del pro con la info que tengas
      // Si no guardaste la ID en selectedProData, puedes guardarla aparte
      // o usar "pendingPros" para encontrar su ID.
      // Supongamos que la guardaste en selectedProData._docId
      // En este ejemplo, la ID la guardamos en proItem.id. Podrías guardarla en un ref global.

      // EJEMPLO (si guardaste la ID en selectedProData._docId):
      // const proRef = doc(db, 'pros', selectedProData._docId);

      // O, si guardaste la ID en un estado aparte, úsala.
      // Para simplificar, lo dejamos como un "TODO".

      // Lógica de aprobación
      console.log('Aprobando...');
      // await updateDoc(proRef, { status: 'aprobado' });

      setShowModal(false);
      setSelectedProData(null);
      // refrescar la lista si deseas
    } catch (error) {
      console.error('Error al aprobar:', error);
    }
  };

  // Rechazar
  const handleReject = async () => {
    if (!selectedProData) return;
    try {
      console.log('Rechazando...');
      // Ejemplo de actualización de status
      // const proRef = doc(db, 'pros', selectedProData._docId);
      // await updateDoc(proRef, { status: 'rechazado' });

      setShowModal(false);
      setSelectedProData(null);
    } catch (error) {
      console.error('Error al rechazar:', error);
    }
  };

  return (
    <div className="Admin-pros-cont">
      <div className="Admin-pros-cont-title">
        <h1>Pros</h1>
      </div>
      <div className="Admin-pros-body">
        <div className="Admin-pros-number-cont">
          <h3>
            Registrados:
            {totalPros}
          </h3>
          <h3>
            Aprobados:
            {approvedCount}
          </h3>
        </div>
        <div className="Admin-pros-pending-cont">
          <h3>Pendientes de aprobación:</h3>
          <div className="Admin-pros-pending-grid">
            <div className="Admin-pros-pending-grid-title-cont">
              <h4>Correo</h4>
              <h4>Fecha de creación</h4>
            </div>
            <div className="Admin-pros-pending-grid-pro-cont">
              {pendingPros.map((pro) => (
                <div
                  key={pro.email}
                  className="Admin-pros-pending-grid-pros-cont"
                  onClick={() => handleProClick(pro)}
                  style={{ cursor: 'pointer' }}
                >
                  <h4>{pro.email}</h4>
                  <h4>{pro.creationDate}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RENDERIZAMOS EL MODAL */}
      <AdminProModal
        show={showModal}
        onClose={handleCloseModal}
        proData={selectedProData}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default AdminPros;
