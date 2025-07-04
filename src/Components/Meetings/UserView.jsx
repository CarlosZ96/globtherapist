/* eslint-disable consistent-return */
import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import ChatComponent from './ChatComponent';
import '../../stylesheets/videocall.css';
import home from '../../img/home 1.png';
import wait from '../../img/Iconjam.png';
import chatIcon from '../../img/bubble-chat.png';

const UserView = ({ meetingParams }) => {
  const { meetingAccess, setMeetingAccess } = useAuth();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { currentUser } = useAuth();
  const [client, setClient] = useState(null);
  const [micTrack, setMicTrack] = useState(null);
  const [cameraTrack, setCameraTrack] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [remoteCameraOn, setRemoteCameraOn] = useState(false);

  // Estados para compartir pantalla
  const [screenTrack, setScreenTrack] = useState(null);
  const [sharingScreen, setSharingScreen] = useState(false);

  // Estado para mostrar/ocultar el chat
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (meetingAccess !== 'approved') return;
    const initAgora = async () => {
      const agoraClient = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
        audio: {
          encoderConfig: 'high_quality',
          playback: true,
          recording: true,
        },
      });
      setClient(agoraClient);
      const appId = process.env.REACT_APP_AGORA_APP_ID;
      if (!appId) {
        console.error('No se encontró REACT_APP_AGORA_APP_ID');
        return;
      }
      try {
        await agoraClient.join(appId, meetingParams.channelId, meetingParams.token, 0);
        console.log('Usuario invitado se unió al canal');

        // Evento: usuario publica un track (audio o video)
        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          console.log('Subscripción a usuario remoto', mediaType, user.uid);

          if (mediaType === 'video') {
            // El contenedor remoto ya está renderizado, se actualiza su visibilidad
            user.videoTrack.play(remoteVideoRef.current);
            setRemoteCameraOn(true);
          }
          if (mediaType === 'audio') {
            user.audioTrack.play();
          }
        });

        // Evento: usuario deja de publicar un track (por ejemplo, apaga la cámara)
        agoraClient.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteCameraOn(false);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.innerHTML = '';
            }
          }
        });

        // Evento: usuario abandona el canal
        agoraClient.on('user-left', (user) => {
          console.log('El usuario', user.uid, 'ha salido del canal');
          setRemoteCameraOn(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.innerHTML = '';
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
      if (screenTrack) screenTrack.close();
      if (client) client.leave();
    };
  }, [meetingAccess, meetingParams]);

  const handleToggleCamera = async () => {
    if (!cameraOn) {
      try {
        const track = await AgoraRTC.createCameraVideoTrack();
        setCameraTrack(track);
        if (client) {
          await client.publish(track);
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

  const handleToggleMic = async () => {
    if (!micOn) {
      try {
        const track = await AgoraRTC.createMicrophoneAudioTrack();
        setMicTrack(track);
        if (client) {
          await client.publish(track);
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

  // Función para compartir pantalla
  const handleScreenShare = async () => {
    if (!client) return;
    if (!sharingScreen) {
      try {
        const track = await AgoraRTC.createScreenVideoTrack();
        await client.publish(track);
        setScreenTrack(track);
        setSharingScreen(true);
      } catch (e) {
        console.error('Error al compartir pantalla:', e);
      }
    } else {
      if (screenTrack) {
        await client.unpublish(screenTrack);
        screenTrack.close();
        setScreenTrack(null);
      }
      setSharingScreen(false);
    }
  };

  const requestAccess = () => {
    setMeetingAccess('pay_pending');
    console.log('Solicitud de acceso enviada');
  };

  return (
    <div className="UserView-cont" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className="video-header">
        <h1>GLOBTHERAPIST</h1>
        <button type="button" onClick={() => navigate('/')}>
          <img src={home} alt="" />
          <h5>Home</h5>
        </button>
      </header>

      {meetingAccess !== 'approved' ? (
        <div className="UserView-request-container">
          {meetingAccess === 'pay_pending' ? (
            <p>Esperando aprobación del host...</p>
          ) : (
            <div className="waitng-room">
              <img src={wait} alt="" />
              <button type="button" onClick={requestAccess}>Esperando aprobación del pro...</button>
              <button
                type="button"
                onClick={() => setMeetingAccess('approved')}
                style={{ marginTop: '1rem' }}
              >
                Simular aprobación (prueba)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="UserView-video-container">
          <div className="video-cont" ref={localVideoRef} />
          {!cameraOn && (
            <div className="cam-txt">
              La cámara está apagada
            </div>
          )}
          {/* Contenedor remoto siempre renderizado; se muestra u oculta mediante CSS */}
          <div className="video-pre-view-cont" style={{ display: remoteCameraOn ? 'block' : 'none' }}>
            <div className="video-pre-view" ref={remoteVideoRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            display: 'flex',
            gap: '0.5rem',
          }}
          >
            <button type="button" onClick={handleToggleCamera}>
              {cameraOn ? 'Apagar cámara' : 'Encender cámara'}
            </button>
            <button type="button" onClick={handleToggleMic}>
              {micOn ? 'Apagar micrófono' : 'Encender micrófono'}
            </button>
            <button type="button" onClick={handleScreenShare}>
              {sharingScreen ? 'Detener pantalla' : 'Compartir pantalla'}
            </button>
            <button
              type="button"
              onClick={() => setShowChat(!showChat)}
              style={{ background: showChat ? '#4CAF50' : '' }}
            >
              <img src={chatIcon} alt="Chat" width="20" height="20" />
            </button>
          </div>
        </div>
      )}

      {/* Modal del chat */}
      {showChat && (
        <div style={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          width: '300px',
          height: '400px',
          backgroundColor: 'white',
          zIndex: 1000,
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
        }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            borderBottom: '1px solid #eee',
          }}
          >
            <h3>Chat</h3>
            <button
              type="button"
              onClick={() => setShowChat(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatComponent clientId={currentUser.uid} channelId={meetingParams.channelId} />
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
