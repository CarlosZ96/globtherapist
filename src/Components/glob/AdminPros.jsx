import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate de exportar tu instancia de Firestore desde aquí
import '../../stylesheets/admin.css';

const AdminPros = () => {
  const [totalPros, setTotalPros] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingPros, setPendingPros] = useState([]);

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
          if (!Object.prototype.hasOwnProperty.call(data, 'status')) {
            const docRef = doc(db, 'pros', docSnapshot.id);
            await updateDoc(docRef, { status: 'pendiente' });
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
                <div key={pro.email} className="Admin-pros-pending-grid-pros-cont">
                  <h4>{pro.email}</h4>
                  <h4>{pro.creationDate}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPros;
