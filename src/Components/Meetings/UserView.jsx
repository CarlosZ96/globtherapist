/* eslint-disable consistent-return */
import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const UserView = ({ meetingParams }) => {
  const { meetingAccess, setMeetingAccess } = useAuth();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null); // Contenedor para la cámara del host

  const [client, setClient] = useState(null);
  const [micTrack, setMicTrack] = useState(null);
  const [cameraTrack, setCameraTrack] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  // Inicializar Agora solo si el acceso fue aprobado
  useEffect(() => {
    if (meetingAccess !== 'approved') return;
    const initAgora = async () => {
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);
      const appId = process.env.REACT_APP_AGORA_APP_ID;
      if (!appId) {
        console.error('No se encontró REACT_APP_AGORA_APP_ID');
        return;
      }
      try {
        await agoraClient.join(appId, meetingParams.channelId, meetingParams.token, 0);
        console.log('Usuario invitado se unió al canal');
        // Escuchar cuando el host publica su video
        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          console.log('Subscripción a usuario remoto', user.uid);
          if (mediaType === 'video' && remoteVideoRef.current) {
            user.videoTrack.play(remoteVideoRef.current);
          }
        });
      } catch (error) {
        console.error('Error al unirse al canal:', error);
      }
    };

    initAgora();

    return () => {
      if (micTrack) micTrack.close();
      if (cameraTrack) cameraTrack.close();
      if (client) client.leave();
    };
  }, [meetingAccess, meetingParams]);

  // Función para encender/apagar la cámara
  const handleToggleCamera = async () => {
    if (!cameraOn) {
      try {
        const track = await AgoraRTC.createCameraVideoTrack();
        setCameraTrack(track);
        if (client) {
          await client.publish([track]);
        }
        if (localVideoRef.current) {
          track.play(localVideoRef.current);
        }
        setCameraOn(true);
      } catch (error) {
        console.error('Error al encender la cámara:', error);
      }
    } else {
      if (client && cameraTrack) {
        await client.unpublish(cameraTrack);
        cameraTrack.close();
        setCameraTrack(null);
      }
      setCameraOn(false);
    }
  };

  // Función para encender/apagar el micrófono
  const handleToggleMic = async () => {
    if (!micOn) {
      try {
        const track = await AgoraRTC.createMicrophoneAudioTrack();
        setMicTrack(track);
        if (client) {
          await client.publish([track]);
        }
        setMicOn(true);
      } catch (error) {
        console.error('Error al encender el micrófono:', error);
      }
    } else {
      if (client && micTrack) {
        await client.unpublish(micTrack);
        micTrack.close();
        setMicTrack(null);
      }
      setMicOn(false);
    }
  };

  // Función para solicitar acceso
  const requestAccess = () => {
    setMeetingAccess('pending');
    console.log('Solicitud de acceso enviada');
  };

  return (
    <div className="UserView-cont" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{
        padding: '1rem',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
      }}
      >
        <h1>Globtherapist - Invitado</h1>
        <button type="button" onClick={() => navigate('/')}>Salir</button>
      </header>

      {meetingAccess !== 'approved' ? (
        <div
          className="UserView-request-container"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {meetingAccess === 'pending' ? (
            <p>Esperando aprobación del host...</p>
          ) : (
            <>
              <p>Solicita acceso a la reunión</p>
              <button type="button" onClick={requestAccess}>Solicitar Acceso</button>
              {/* Botón de prueba para simular aprobación (como si el host aprobara) */}
              <button
                type="button"
                onClick={() => setMeetingAccess('approved')}
                style={{ marginTop: '1rem' }}
              >
                Simular aprobación (prueba)
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="UserView-video-container" style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
          <div ref={localVideoRef} style={{ width: '100%', height: '100%' }} />
          {!cameraOn && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
            }}
            >
              La cámara está apagada
            </div>
          )}
          {/* Contenedor para video remoto del host */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '200px',
            height: '150px',
            border: '2px solid #fff',
            zIndex: 10,
          }}
          >
            <div ref={remoteVideoRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '0.5rem',
            borderRadius: '0.5rem',
          }}
          >
            <button type="button" onClick={handleToggleCamera} style={{ marginRight: '1rem' }}>
              {cameraOn ? 'Apagar cámara' : 'Encender cámara'}
            </button>
            <button type="button" onClick={handleToggleMic}>
              {micOn ? 'Apagar micrófono' : 'Encender micrófono'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

UserView.propTypes = {
  meetingParams: PropTypes.shape({
    token: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
  }),
};

UserView.defaultProps = {
  meetingParams: null,
};

export default UserView;
