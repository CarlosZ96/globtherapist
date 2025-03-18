import React from 'react';
import '../../stylesheets/admin.css';

const AdminPros = () => {
  return (
    <div className="Admin-pros-cont">
      <div className="Admin-pros-cont-title">
        <h1>Pros</h1>
      </div>
      <div className="Admin-pros-body">
        <div className="Admin-pros-number-cont">
          <h3>Registrados:</h3>
          <h3>Aprobados:</h3>
        </div>
        <div className="Admin-pros-pending-cont">
          <h3>Pendientes de aprobación:</h3>
        </div>
      </div>
    </div>
  );
};

export default AdminPros;
