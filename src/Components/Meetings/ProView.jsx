import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import ChatComponent from './ChatComponent';
import home from '../../img/home 1.png';
import '../../stylesheets/videocall.css';

const HostNotification = () => {
  const { meetingAccess, setMeetingAccess } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (meetingAccess !== 'pending') return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ffc',
        padding: '0.5rem',
        borderRadius: '0.5rem',
      }}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={() => setShowDetails(!showDetails)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowDetails(!showDetails);
          }
        }}
        style={{ cursor: 'pointer', fontWeight: 'bold' }}
      >
        !
      </span>
      {showDetails && (
        <div>
          <p>El usuario X solicita acceso a la reunión</p>
          <button type="button" onClick={() => setMeetingAccess('approved')}>
            Aceptar
          </button>
          <button type="button" onClick={() => setMeetingAccess('none')}>
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
};

const ProView = ({ meetingParams }) => {
  const { currentPro } = useAuth();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [client, setClient] = useState(null);
  const [micTrack, setMicTrack] = useState(null);
  const [cameraTrack, setCameraTrack] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [remoteCameraOn, setRemoteCameraOn] = useState(false);

  useEffect(() => {
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
        console.error('No se encontró REACT_APP_AGORA_APP_ID en las variables de entorno');
        return;
      }
      try {
        await agoraClient.join(appId, meetingParams.channelId, meetingParams.token, 0);
        console.log('Se unió al canal sin tracks');

        // Evento: usuario publica un track (audio o video)
        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          console.log('Subscripción a usuario remoto', mediaType, user.uid);

          if (mediaType === 'video') {
            user.videoTrack.play(remoteVideoRef.current);
            setRemoteCameraOn(true);
          }
          if (mediaType === 'audio') {
            user.audioTrack.play();
          }
        });

        // Evento: usuario deja de publicar (apaga la cámara)
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
      if (client) client.leave();
    };
  }, [meetingParams]);

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
      }}
    >
      <header className="video-header">
        <h1>GLOBTHERAPIST</h1>
        <button type="button" onClick={() => navigate('/')}>
          <img src={home} alt="" />
          <h5>Home</h5>
        </button>
      </header>

      <HostNotification />

      <div className="UserView-video-container">
        <div ref={localVideoRef} className="video-cont" />
        {!cameraOn && (
          <div className="cam-txt">
            La cámara está apagada
          </div>
        )}
        {/* Contenedor remoto siempre renderizado; se muestra u oculta mediante CSS */}
        <div className="video-pre-view-cont" style={{ display: remoteCameraOn ? 'block' : 'none' }}>
          <div className="video-pre-view" ref={remoteVideoRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '53%',
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
      <ChatComponent clientId={currentPro.uid} channelId={meetingParams.channelId} />
    </div>
  );
};

ProView.propTypes = {
  meetingParams: PropTypes.shape({
    token: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
  }).isRequired,
};

export default ProView;
