import React from 'react';
import getEmailHtml from './mails/emailTemplate';

const EmailPreview = () => {
  // Datos de prueba para la vista previa
  const emailData = {
    collection: 'pros',
    therapyType: 'fisica',
    date: '1',
    dayOfWeek: 'lun', // Se mostrará como "Lun 20"
    fullDate: 'de Abril a las 8:00am',
    userName: 'Juan',
    proName: 'Dr. Pérez',
    userEmail: 'juan@example.com',
    userProfession: 'Fisioterapeuta',
    userTel: '555-1234',
  };

  const emailHtml = getEmailHtml(emailData);

  return (
    <div
      style={{
        minHeight: 600,
        maxWidth: 800,
        margin: '0 auto',
        backgroundColor: '#F2F5FC',
        padding: '20px',
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
    </div>
  );
};

export default EmailPreview;
