/* eslint-disable jsx-a11y/alt-text */
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
import endCallIcon from '../../img/phone.png';
import chatIcon from '../../img/bubble-chat.png';
import MicroIcon from '../../img/mic (1).png';
import ShareIcon from '../../img/share.png';
import CamIcon from '../../img/videocam (1) 1.svg';

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
  const [screenTrack, setScreenTrack] = useState(null);
  const [sharingScreen, setSharingScreen] = useState(false);

  /* --- NUEVO: responsive/mobile state --- */
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 570 : false));
  const [showChat, setShowChat] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 570 : false));

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 570);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setShowChat(isMobile);
  }, [isMobile]);

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

        agoraClient.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteCameraOn(false);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.innerHTML = '';
            }
          }
        });

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

  const cleanupAgoraResources = async () => {
    try {
      if (micTrack) {
        micTrack.close();
        setMicTrack(null);
        setMicOn(false);
      }
      if (cameraTrack) {
        cameraTrack.close();
        setCameraTrack(null);
        setCameraOn(false);
      }
      if (screenTrack) {
        screenTrack.close();
        setScreenTrack(null);
        setSharingScreen(false);
      }

      if (client) {
        await client.leave();
        setClient(null);
      }

      setRemoteCameraOn(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('Error al limpiar recursos de Agora:', error);
    }
  };

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

  const handleEndCall = async () => {
    await cleanupAgoraResources();
    navigate('/');
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
          <img src={home} alt="" className="video-header-img" />
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
          <div className="video-pre-view-cont" style={{ display: remoteCameraOn ? 'block' : 'none' }}>
            <div className="video-pre-view" ref={remoteVideoRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div className="video-controls-cont">
            <div className="video-controls">
              <button type="button" className="video-buttons" onClick={handleToggleCamera}>
                <img src={CamIcon} className="video-button-img" />
                {cameraOn ? 'Apagar cámara' : 'Encender cámara'}
              </button>
              <button type="button" className="video-buttons" onClick={handleToggleMic}>
                <img src={MicroIcon} className="video-button-img" />
                {micOn ? 'Apagar micrófono' : 'Encender micrófono'}
              </button>
              <button type="button" className="video-buttons" onClick={handleScreenShare}>
                <img src={ShareIcon} className="video-button-img" />
                {sharingScreen ? 'Detener pantalla' : 'Compartir pantalla'}
              </button>
              <button
                type="button"
                className="video-buttons"
                onClick={() => setShowChat(!showChat)}
                style={{ background: showChat ? '#233cb5' : '' }}
              >
                <img src={chatIcon} className="video-button-img" />
                Abrir chat
              </button>
              <button
                type="button"
                className="video-buttons"
                onClick={handleEndCall}
              >
                <img src={endCallIcon} alt="Colgar" width="20" height="20" />
                Cerrar llamada
              </button>
            </div>
            <div className="video-user-info">
              <p>
                {currentUser.username || 'Usuario'}
              </p>
              <p>
                ProUserame
              </p>
            </div>
          </div>

          {/* CHAT responsive */}
          {showChat && (
            isMobile ? (
              <div className="chat-mobile-cont">
                <div className="chat-mobile-header">
                  <h3>Chat</h3>
                  <button
                    type="button"
                    className="chat-close-btn"
                    onClick={() => setShowChat(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="chat-mobile-body">
                  <ChatComponent clientId={currentUser.uid} channelId={meetingParams.channelId} />
                </div>
              </div>
            ) : (
              <div
                className="chat-desktop-floating"
                style={{
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
            )
          )}

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
