import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

// Componente de notificación para el host
const HostNotification = () => {
  const { meetingAccess, setMeetingAccess } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (meetingAccess !== 'pending') return null;

  return (
    <div style={{
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
          <button type="button" onClick={() => setMeetingAccess('approved')}>Aceptar</button>
          <button type="button" onClick={() => setMeetingAccess('none')}>Rechazar</button>
        </div>
      )}
    </div>
  );
};

const ProView = ({ meetingParams, RtcRole }) => {
  const { currentPro } = useAuth();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const [client, setClient] = useState(null);
  const [micTrack, setMicTrack] = useState(null);
  const [cameraTrack, setCameraTrack] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const roleLabel = RtcRole === 'uidHost' ? 'Host' : 'Guest';

  useEffect(() => {
    const initAgora = async () => {
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);
      const appId = process.env.REACT_APP_AGORA_APP_ID;
      if (!appId) {
        console.error('No se encontró REACT_APP_AGORA_APP_ID en las variables de entorno');
        return;
      }
      try {
        await agoraClient.join(
          appId,
          meetingParams.channelId,
          meetingParams.token,
          0,
        );
        console.log('Se unió al canal sin tracks');
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

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative',
    }}
    >
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: '#f0f0f0',
      }}
      >
        <h1 style={{ margin: 0 }}>Globtherapist</h1>
        <div>
          <button type="button" style={{ marginRight: '1rem' }}>
            {currentPro && currentPro.Nombre ? `${currentPro.Nombre} (${roleLabel})` : 'Profesional'}
          </button>
          <button type="button" onClick={() => navigate('/')}>Salir</button>
        </div>
      </header>

      {/* Notificación para el host */}
      <HostNotification />

      <div style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
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
      </div>

      <div style={{ padding: '1rem', backgroundColor: '#f8f8f8' }}>
        <button type="button" onClick={handleToggleCamera} style={{ marginRight: '1rem' }}>
          {cameraOn ? 'Apagar cámara' : 'Encender cámara'}
        </button>
        <button type="button" onClick={handleToggleMic}>
          {micOn ? 'Apagar micrófono' : 'Encender micrófono'}
        </button>
      </div>
    </div>
  );
};

ProView.propTypes = {
  meetingParams: PropTypes.shape({
    token: PropTypes.string.isRequired,
    channelId: PropTypes.string.isRequired,
  }).isRequired,
  RtcRole: PropTypes.string.isRequired,
};

export default ProView;
