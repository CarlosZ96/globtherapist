import {
  Html,
  Body,
  Container,
  Text,
  Section,
  Column,
  Row,
  Img,
  Button,
  Head,
  Preview,
} from '@react-email/components';
import * as React from 'react';
import PropTypes from 'prop-types';

const WelcomeEmail = ({ userName, collection = 'users' }) => {
  const isPro = collection === 'pros';

  const body = {
    backgroundColor: '#2B3E9D',
    margin: 0,
    padding: '20px 0',
    fontFamily: "'Itim', Arial, sans-serif",
  };

  const container = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '0 auto',
    overflow: 'hidden',
  };

  const header = {
    backgroundColor: '#2B3E9D',
    padding: '30px 0',
    textAlign: 'center',
  };

  const headerText = {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0,
  };

  const section = {
    padding: '20px',
  };

  const welcomeColumn = {
    paddingRight: '10px',
    verticalAlign: 'top',
  };

  const imageColumn = {
    paddingLeft: '10px',
    verticalAlign: 'top',
  };

  const title = {
    color: '#041B5E',
    fontSize: '20px',
    lineHeight: 1.5,
    marginBottom: '15px',
  };

  const paragraph = {
    color: '#041B5E',
    fontSize: '16px',
    lineHeight: 1.5,
    margin: '10px 0',
  };

  const image = {
    borderRadius: '8px',
    maxWidth: '300px',
    width: '100%',
  };

  const subtitle = {
    color: '#041B5E',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '15px 0',
  };

  const button = {
    backgroundColor: '#041B5E',
    color: '#ffffff',
    padding: '10px 25px',
    borderRadius: '4px',
    fontSize: '25px',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center',
    margin: '20px auto',
  };

  // Configuración de terapias
  const therapyIcons = ['💪', '💬', '🧠', '💼'];
  const therapyDescriptions = [
    'Ejercicios personalizados y actividades adaptadas. Te ayudamos a mejorar tu fuerza y movilidad.',
    'Te ayudamos a fortalecer tu comunicación, redacción y personalizar métodos y técnicas efectivas.',
    'Junto a un profesional experto, aprende a manejar tu bienestar emocional y mejora tu salud mental.',
    'Te ayudamos a mejorar tu adaptación y autonomía, enfocándonos en actividades de la vida diaria y laboral.',
  ];

  const therapyStyles = [
    { // Física
      section: { backgroundColor: '#EF5557', padding: '15px' },
      title: {
        color: '#4B0000', fontSize: '25px', fontWeight: 'bold', margin: 0,
      },
      content: { color: '#ffffff', fontSize: '18px', lineHeight: 1.5 },
    },
    { // Lenguaje
      section: { backgroundColor: '#687AD7', padding: '15px' },
      title: {
        color: '#041B5E', fontSize: '25px', fontWeight: 'bold', margin: 0,
      },
      content: { color: '#ffffff', fontSize: '18px', lineHeight: 1.5 },
    },
    { // Mental
      section: { backgroundColor: '#38DDE3', padding: '15px' },
      title: {
        color: '#041B5E', fontSize: '25px', fontWeight: 'bold', margin: 0,
      },
      content: { color: '#ffffff', fontSize: '18px', lineHeight: 1.5 },
    },
    { // Ocupacional
      section: { backgroundColor: '#FFD904', padding: '15px' },
      title: {
        color: '#041B5E', fontSize: '25px', fontWeight: 'bold', margin: 0,
      },
      content: { color: '#000000', fontSize: '18px', lineHeight: 1.5 },
    },
  ];

  return (
    <Html>
      <Head />
      <Preview>¡Bienvenido a GlobTherapist!</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Cabecera */}
          <Section style={header}>
            <Text style={headerText}>GLOBTHERAPIST</Text>
          </Section>

          {/* Sección de Bienvenida */}
          <Section style={section}>
            <Row>
              <Column style={welcomeColumn}>
                <Text style={title}>
                  ¡Hola
                  {' '}
                  {userName}
                  , bienvenido a GlobTherapist!
                </Text>
                <Text style={paragraph}>
                  {isPro
                      ? '¡No más filas ni trancones, aquí podrás trabajar con diferentes tipos de terapias personalizadas a las necesidades de los usuarios y ¡Todo desde casa!'
                      : '¡No más filas ni trancones, aquí podrás programar diferentes tipos de terapias personalizadas a tus necesidades sin salir de casa al mejor precio!'}
                </Text>
              </Column>
              <Column style={imageColumn}>
                <Img
                  src="https://images.pexels.com/photos/4225920/pexels-photo-4225920.jpeg"
                  alt="Persona recibiendo terapia en línea"
                  style={image}
                />
              </Column>
            </Row>
          </Section>

          <Section style={section}>
            <Text style={subtitle}>¿Cómo funciona?</Text>
            <Text style={paragraph}>
              {isPro
                  ? 'Tendrás la posibilidad de elegir tus horarios y tipos de terapias que atenderás y el usuario programará una videollamada contigo dentro de tus horarios. Te avisaremos por correo los datos de la cita, así como en la página verás todas tus citas asignadas.'
                  : 'Tendrás una cita que tú programarás por video con alguno(a) de nuestros profesionales expertos en tus necesidades en alguna de nuestras diferentes terapias.'}
            </Text>
          </Section>

          {/* Terapias */}
          {['Física', 'Lenguaje', 'Mental', 'Ocupacional'].map((therapy, index) => (
            <Section key={therapy} style={therapyStyles[index].section}>
              <Text style={therapyStyles[index].title}>
                {therapy}
                {' '}
                {therapyIcons[index]}
              </Text>
              <Text style={therapyStyles[index].content}>
                {therapyDescriptions[index]}
              </Text>
            </Section>
            ))}

          {/* Botón de acción */}
          <Section style={section}>
            <Button href="#" style={button}>
              Agenda tu cita aquí
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Estilos
WelcomeEmail.propTypes = {
  userName: PropTypes.string.isRequired,
  collection: PropTypes.string.isRequired,
};

export default WelcomeEmail;
