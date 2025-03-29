function getEmailHtml({
  // Props mínimos que necesitas (ajusta según tus necesidades)
  collection, // 'users' o 'pros'
  therapyType, // 'fisica', 'lenguaje', 'mental', 'ocupacional'
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
    greetingText = `Hola, ${userName} tu cita se programó exitosamente`;
  } else {
    greetingText = `Hola, ${proName}, ${userName} programó una cita contigo`;
  }

  // Texto dinámico para la sección "¿Con quién?"
  const withWhomTitle = '¿Con quién?';
  let withWhomName = '';
  let withWhomEmail = '';
  let withWhomExtraLabel = '';
  let withWhomExtraValue = '';

  if (collection === 'users') {
    withWhomName = proName || 'Nombre del profesional';
    withWhomEmail = userEmail || 'CorreoDelPro@example.com';
    withWhomExtraLabel = 'Profesión';
    withWhomExtraValue = userProfession || 'Fisioterapeuta';
  } else {
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

  const { color, icon, text } = therapyConfigs[therapyType] || therapyConfigs.fisica;

  const emailHtml = `
<center>    
  <table width="420" align="center" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; background-color: #F2F5FC; border-radius: 10px; overflow: hidden;">
    <tr>
      <td align="center" style="padding: 20px;">
        <p style="font-size: 22px; margin: 0 0 20px 0; text-align: center; color: #041B5E; font-weight: bold;">
          ${greetingText}
        </p>

        <!-- Sección: ¿Cuándo es la cita? -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
          <tr>
            <td align="left" style="font-size: 22px; padding-left: 64px; padding-bottom: 12px; color: #041B5E;">
              ¿Cuándo es la cita? <span style="font-size: 23px;">🤔</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #081F4A; color:#fff; padding: 10px; border-radius: 8px; margin: 0 auto;">
              <div style="font-size: 20px; font-weight: bold;">${date || 'Lun 20'}</div>
              <div style="font-size: 20px;">${fullDate || 'De Marzo a las 8:00am'}</div>
            </td>
          </tr>
        </table>

        <!-- Sección: ¿Con quién? -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; color: #041B5E;">
          <tr>
            <td align="left" style="font-size: 22px; padding-left: 112px; padding-bottom: 12px;">
              ${withWhomTitle}
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="5" cellspacing="0" border="0" style="background-color: #081F4A; height: 70px;">
                <tr>
                  <td align="center" style="font-size: 16px; font-weight: bold; color: #FFF30C;">
                    ${withWhomName}
                  </td>
                </tr>
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td style="font-size: 20px; color: #687AD7; padding-right: 5px;">
                          Correo:
                        </td>
                        <td>
                          <h4 style="font-size: 14px; color: #fff; margin: 0;">
                            ${withWhomEmail}
                          </h4>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 14px; color: #fff;">
                    ${withWhomExtraLabel}: ${withWhomExtraValue}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Sección: ¿Qué terapia es? -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
          <tr>
            <td align="left" style="font-size: 16px; padding-bottom: 8px; color: #041B5E;">
              ¿Qué terapia es?
            </td>
          </tr>
          <tr>
            <td style="background-color: ${color}; padding: 10px; border-radius: 8px; color: #FFFFFF; height: 150px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 16px; font-weight: bold; padding-right: 6px; width: 30px;">
                    ${therapyType || 'fisica'}
                  </td>
                  <td style="font-size: 18px;">
                    ${icon}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 8px; font-size: 14px;">
                    ${text}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</center>
  `;

  return emailHtml;
}

export const getValidationEmailHtml = () => {
  return `
<center>    
  <table width="420" align="center" cellpadding="0" cellspacing="0" border="0" 
         style="font-family: Arial, sans-serif; background-color: #F2F5FC; 
                border-radius: 10px; overflow: hidden; padding: 30px 20px; min-width: 500px;">
    <tr>
      <td align="center" style="padding: 20px;">
        <h1 style="color: #041B5E; font-size: 28px; margin-bottom: 25px;">
          Estamos revisando tus datos
        </h1>
        
        <!-- Agregar imagen con enlace encima del contenedor de validación -->
        <a target="_blank" style="text-decoration: none;">
          <img src="https://cdn-icons-png.flaticon.com/512/3574/3574808.png" alt="Reading Book Icon" style="width: 165px; height: auto; margin-bottom: 15px;">
        </a>
        
        <div style="background-color: #041B5E; border-radius: 12px; padding: 25px; 
                    margin-bottom: 25px; text-align: center;">
          <p style="color: #FFF30C; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Tardaremos de 2 a 3 días hábiles en validar tu información.
          </p>
          
          <p style="color: #fff; font-size: 16px; line-height: 1.6;">
            Ahora trabajaremos juntos para ayudar a nuestros usuarios a tener una vida más saludable 
            y tenemos que afinar nuestra confianza, por eso tenemos que validar ¡Lo pro que eres!
          </p>
        </div>

        <div style="border-top: 2px solid #E2E8F0; padding-top: 25px;">
          <p style="color: #718096; font-size: 14px; margin: 0;">
            Más información en: 
            <a href="mailto:globtherapist@gmail.com" 
               style="color: #687AD7; text-decoration: none;">
              globtherapist@gmail.com
            </a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</center>
  `;
};

export default getEmailHtml;
