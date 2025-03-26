// emailTemplate.js

const getEmailHtml = (userName, collection) => {
  let contentHowItWorks;
  let contentHowItWorksp;

  if (collection === 'users') {
    contentHowItWorks = `
        <span style="font-size: 16px;">
          ¡No más filas ni trancones, aquí podrás programar diferentes tipos de terapias 
          personalizadas a tus necesidades sin salir de casa al mejor precio!
        </span>
      `;
    contentHowItWorksp = `
        <p style="margin: 10px 0; font-size: 16px; color: #041B5E;">
          Tendrás una cita que tú programarás por video con alguno(a) de nuestros 
          profesionales expertos en tus necesidades en alguna de nuestras diferentes terapias.
        </p>
      `;
  } else {
    contentHowItWorks = `
        <span style="font-size: 16px;">
          ¡No más filas ni trancones, aquí podrás trabajar con diferentes tipos de terapias personalizadas a las necesidades de los usuarios y ¡Todo desde casa!
        </span>
      `;
    contentHowItWorksp = `
        <p style="margin: 10px 0; font-size: 16px; color: #041B5E;">
          Tendrás la posibilidad de elegir tus horarios y tipos de terapias que atenderás y el usuario programará una videollamada contigo dentro de tus horarios. Te avisaremos por correo los datos de la cita, así como en la página verás todas tus citas asignadas.
        </p>
      `;
  }

  return `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" 
             style="background-color: #2B3E9D; margin: 0; padding: 0;">
        <!-- Contenedor principal con fondo azul (#2B3E9D) -->
        <tr>
          <td align="center" style="padding: 20px;">
            <!-- Tabla blanca central -->
            <table border="0" cellpadding="0" cellspacing="0" width="600" 
                   style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden; 
                          font-family: 'Itim', Arial, sans-serif;">
              <!-- Cabecera: Título grande "GLOBTHERAPIST" -->
              <tr>
                <td align="center" 
                    style="background-color: #2B3E9D; padding: 30px 0; color: rgba(255,255,255,0.9); 
                           font-size: 36px; font-weight: bold;">
                  GLOBTHERAPIST
                </td>
              </tr>
              
              <!-- Sección: Bienvenida -->
              <tr>
                <td style="padding: 20px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <!-- Texto de Bienvenida (columna izquierda) -->
                      <td valign="top" 
                          style="color: #041B5E; font-size: 20px; line-height: 1.5; padding-right: 10px;">
                        <strong>¡Hola ${userName}, bienvenido a GlobTherapist!</strong><br/>
                        ${contentHowItWorks}
                      </td>
                      <!-- Imagen de ejemplo (columna derecha) -->
                      <td valign="top" align="right" style="padding-left: 10px;">
                        <img src="https://images.pexels.com/photos/4225920/pexels-photo-4225920.jpeg" 
                             alt="Persona recibiendo terapia en línea"
                             style="border-radius: 8px; max-width: 300px;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Sección: ¿Cómo funciona? -->
              <tr>
                <td style="padding: 20px; color: #041B5E; font-size: 18px;">
                  <strong>¿Cómo funciona?</strong><br/>
                  ${contentHowItWorksp}
                </td>
              </tr>
              
              <!-- Sección: Terapia Física -->
              <tr>
                <td style="background-color: #EF5557; padding: 15px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="color: #4B0000; font-size: 25px; font-weight: bold;">
                        Física 💪
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #FFFFFF; font-size: 18px; line-height: 1.5;">
                        Ejercicios personalizados y actividades adaptadas. 
                        Te ayudamos a mejorar tu fuerza y movilidad.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Sección: Terapia Lenguaje -->
              <tr>
                <td style="background-color: #687AD7; padding: 15px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="color: #041B5E; font-size: 25px; font-weight: bold;">
                        Lenguaje 💬
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #FFFFFF; font-size: 18px; line-height: 1.5;">
                        Te ayudamos a fortalecer tu comunicación, redacción y personalizar métodos 
                        y técnicas efectivas.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Sección: Terapia Mental -->
              <tr>
                <td style="background-color: #38DDE3; padding: 15px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="color: #041B5E; font-size: 25px; font-weight: bold;">
                        Mental 🧠
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #FFFFFF; font-size: 18px; line-height: 1.5;">
                        Junto a un profesional experto, aprende a manejar tu bienestar emocional 
                        y mejora tu salud mental.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Sección: Terapia Ocupacional -->
              <tr>
                <td style="background-color: #FFD904; padding: 15px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="color: #041B5E; font-size: 25px; font-weight: bold;">
                        Ocupacional 💼
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #000000; font-size: 18px; line-height: 1.5;">
                        Te ayudamos a mejorar tu adaptación y autonomía, enfocándonos en actividades 
                        de la vida diaria y laboral.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Botón: Agendar cita -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <a href="#" 
                     style="background-color: #041B5E; color: #FFFFFF; text-decoration: none; 
                            padding: 10px 25px; border-radius: 4px; font-size: 25px;">
                    Agenda tu cita aquí
                  </a>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    `;
};

export default getEmailHtml;
