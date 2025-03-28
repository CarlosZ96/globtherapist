// emailTemplate.js

function getEmailHtml({
  // Props mínimos que necesitas (ajusta según tus necesidades)
  collection, // 'users' o 'pros'
  therapyType, // 'fisica', 'lenguaje', 'mental', 'ocupacional'
  id2, // si requieres usarlo en alguna parte de la plantilla
  date, // ejemplo: 'Lun 20'
  fullDate, // ejemplo: 'De Marzo a las 8:00am'
  userName, // nombre del usuario (si collection = 'users')
  proName, // nombre del profesional (si collection = 'pros')
  userEmail, // email (depende de con quién es la cita)
  userProfession, // profesión (o teléfono) según corresponda
  userTel, // teléfono si es un pro recibiendo cita
}) {
  // Texto dinámico para el saludo según 'collection'
  let greetingText;
  if (collection === 'users') {
    // Ejemplo: "Hola, Juan tu cita se programó exitosamente"
    greetingText = `Hola, ${userName} tu cita se programó exitosamente`;
  } else {
    // Ejemplo: "Hola, Dr. Pérez, Juan programó una cita contigo"
    greetingText = `Hola, ${proName}, ${userName} programó una cita contigo`;
  }

  // Texto dinámico para la sección "¿Con quién?"
  // Si es 'users', mostramos datos del profesional
  // Si es 'pros', mostramos datos del usuario
  const withWhomTitle = '¿Con quién?';
  let withWhomName = '';
  let withWhomEmail = '';
  let withWhomExtraLabel = ''; // "Profesión" o "Teléfono"
  let withWhomExtraValue = '';

  if (collection === 'users') {
    withWhomName = proName || 'Nombre del profesional';
    withWhomEmail = userEmail || 'CorreoDelPro@example.com';
    withWhomExtraLabel = 'Profesión';
    withWhomExtraValue = userProfession || 'Fisioterapeuta';
  } else {
    // collection = 'pros'
    withWhomName = userName || 'Nombre del usuario';
    withWhomEmail = userEmail || 'CorreoDelUsuario@example.com';
    withWhomExtraLabel = 'Teléfono';
    withWhomExtraValue = userTel || '123456789';
  }

  // Configuración de la terapia según 'therapyType'
  const therapyConfigs = {
    fisica: {
      color: '#EF5557',
      icon: '💪',
      text: 'Ejercicios personalizados adaptados a tus necesidades  te ayudaremos a recuperar la movilidad y la fuerza.',
    },
    lenguaje: {
      color: '#687AD7',
      icon: '💬',
      text: 'Te ayudamos a fortalecer tu comunicación, escucha y habla mediante prácticos y personalizados métodos.',
    },
    mental: {
      color: '#38DDE3',
      icon: '🧠',
      text: 'Junto con un profesional exploraremos de manera segura tus pensamientos y experiencias para fortalecer tu bienestar emocional.',
    },
    ocupacional: {
      color: '#FFD904',
      icon: '💼',
      text: 'Te apoyaremos para que te desenvuelvas con confianza y eficiencia en tus actividades diarias (trabajo, hogar, autocuidado).',
    },
  };

  // Elegimos la configuración según la terapia (o fisica por defecto)
  const { color, icon, text } = therapyConfigs[therapyType] || therapyConfigs.fisica;

  // Plantilla de correo en HTML
  const emailHtml = `   
        <div style="
        font-family: Arial, sans-serif; 
        background-color: #F2F5FC; 
        padding: 20px; 
        width: 420px;
        height: 600px;
        margin: 0 151px 0 151px;
        border-radius: 10px;
        color: #081F4A;
      ">
        <!-- Saludo dinámico -->
        <p style="
          font-size: 22px; 
          margin: 0 0 20px 0; 
          text-align: center;
        ">
          ${greetingText}
        </p>
  
        <!-- Sección: ¿Cuándo es la cita? -->
        <h3 style="font-size: 22px; margin-bottom: 12px; margin-left: 64px;">
          ¿Cuándo es la cita? <span style="font-size: 23px;">🤔</span>
        </h3>
        <div style="
          background-color: #081F4A; 
          color: #FFFFFF; 
          padding: 10px;
          height: 70px; 
          border-radius: 8px; 
          text-align: center; 
          margin-bottom: 20px;
        ">
          <div style="font-size: 20px; font-weight: bold;">${date || 'Lun 20'}</div>
          <div style="font-size: 20px;">${fullDate || 'De Marzo a las 8:00am'}</div>
        </div>
  
        <!-- Sección: ¿Con quién? -->
        <h3 style="font-size: 22px; margin-bottom: 12px; margin-left: 112px;">${withWhomTitle}</h3>
        <div style="
          align-items: center; 
          margin-bottom: 10px;
        ">
          <div style="margin-left: 10px; background-color: #081F4A; height: 70px;">
            <div style="font-size: 16px; font-weight: bold; color:#FFF30C; text-align: center;">${withWhomName}</div>
            <div style="font-size: 20px; color:#687AD7;">Correo:<h4 style="font-size: 14px; color:#fff ;"> ${withWhomEmail}</h4>
            </div>
            <div style="font-size: 14px; color:#fff;">
              ${withWhomExtraLabel}: ${withWhomExtraValue}
            </div>
          </div>
        </div>
  
        <!-- Sección: ¿Qué terapia es? -->
        <h3 style="font-size: 16px; margin-bottom: 8px;">¿Qué terapia es?</h3>
        <div style="
          background-color: ${color}; 
          padding: 10px; 
          border-radius: 8px; 
          color: #FFFFFF;
        ">
          <span style="font-size: 16px; font-weight: bold; margin-right: 6px;">
            ${therapyType || 'fisica'}
          </span>
          <span style="font-size: 18px;">${icon}</span>
          <p style="margin: 8px 0 0 0; font-size: 14px;">
            ${text}
          </p>
        </div>
  
        <!-- Puedes usar 'id2' aquí si lo necesitas -->
        ${
  id2
    ? `<div style="margin-top: 20px; font-size: 12px; text-align: center;">
                 ID2 de referencia: <strong>${id2}</strong>
               </div>`
    : ''
}
  
      </div>
    `;

  return emailHtml;
}

export default getEmailHtml;
