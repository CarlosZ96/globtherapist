import React from 'react';
import PropTypes from 'prop-types';
import getEmailHtml from './mails/emailTemplate';

const EmailPreview = ({ userName }) => {
  // Generamos el HTML con la función getEmailHtml
  const emailHtml = getEmailHtml({
    // Aquí defines los valores que quieras pasar a la plantilla
    collection: 'pros', // 'users' o 'pros'
    therapyType: 'fisica', // 'fisica', 'lenguaje', 'mental', 'ocupacional'
    id2: 'algún-valor-de-ejemplo',
    date: 'Lun 20',
    fullDate: 'de Marzo a las 8:00 am',
    userName, // viene de las props
    proName: 'Dr. Pérez',
    userEmail: 'drperez@example.com',
    userProfession: 'Fisioterapeuta',
    userTel: '555-1234',
  });

  return (
    <div style={{
      minHeight: 600, maxWidth: 800, margin: '0 auto', backgroundColor: '#2B3E9D', paddingTop: 10, paddingBottom: 30,
    }}
    >
      <h2 style={{
        height: 50, textAlign: 'center', fontSize: '30px', color: '#ffffff73', fontFamily: 'Arial, sans-serif',
      }}
      >
        ¡Gracias por confiar en nosotros!
      </h2>
      <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
    </div>
  );
};

EmailPreview.propTypes = {
  userName: PropTypes.string.isRequired,
};

export default EmailPreview;
