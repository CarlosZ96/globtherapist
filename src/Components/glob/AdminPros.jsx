/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, updateDoc, doc, getDoc, setDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminProModal from '../AdminProModal';
import { getRejectionEmailHtml } from '../mails/emailTemplate';
import '../../stylesheets/admin.css';

const AdminPros = () => {
  const [totalPros, setTotalPros] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingPros, setPendingPros] = useState([]);
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
          const proDocId = docSnapshot.id;

          if (!Object.prototype.hasOwnProperty.call(data, 'status')) {
            const proRef = doc(db, 'pros', proDocId);
            await updateDoc(proRef, { status: 'pendiente' });
            data.status = 'pendiente';
          }

          if (data.status === 'aprobado') {
            approved += 1;
          }

          if (data.status === 'pendiente') {
            let creationDate;
            if (data.createdAt && data.createdAt.toDate) {
              creationDate = formatDate(data.createdAt.toDate());
            } else {
              creationDate = 'No definida';
            }
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

  const handleProClick = async (proItem) => {
    try {
      const proRef = doc(db, 'pros', proItem.id);
      const proSnap = await getDoc(proRef);

      if (proSnap.exists()) {
        const data = proSnap.data();
        setSelectedProData({ ...data, docId: proItem.id });
        setShowModal(true);
      } else {
        console.log('No existe el doc del pro con id:', proItem.id);
      }
    } catch (error) {
      console.error('Error al obtener datos completos del pro:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProData(null);
  };

  const handleApprove = async () => {
    if (!selectedProData) return;
    try {
      console.log('Aprobando...');
      const proRef = doc(db, 'pros', selectedProData.docId);
      await updateDoc(proRef, { status: 'aprobado' });
      setShowModal(false);
      setSelectedProData(null);
    } catch (error) {
      console.error('Error al aprobar:', error);
    }
  };

  const handleReject = async (reason) => { // Recibir la razón como parámetro
    if (!selectedProData) return;
    try {
      console.log('Rechazando...');
      const proRef = doc(db, 'pros', selectedProData.docId);

      // Actualizar estado a rechazado
      await updateDoc(proRef, {
        status: 'rechazado',
        rejectionReason: reason, // Guardar la razón en Firestore si es necesario
        attemptsLeft: 3, // Establecer intentos si aplica
      });

      // Crear documento para Trigger Email
      const emailContent = getRejectionEmailHtml({
        reason,
        attemptsLeft: 3,
      });

      await setDoc(doc(db, 'mail', `${selectedProData.docId}-rejection`), {
        to: selectedProData.email,
        message: {
          subject: 'Estado de tu solicitud de profesional',
          html: emailContent,
        },
      });

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
