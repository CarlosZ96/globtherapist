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

          if (mediaType === 'video' && remoteVideoRef.current) {
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

  const requestAccess = () => {
    setMeetingAccess('pending');
    console.log('Solicitud de acceso enviada');
  };

  return (
    <div className="UserView-cont" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        className="video-header"
      >
        <h1>GLOBTHERAPIST</h1>
        <button type="button" onClick={() => navigate('/')}>
          <img src={home} alt="" />
          <h5>Home</h5>
        </button>
      </header>

      {meetingAccess !== 'approved' ? (
        <div className="UserView-request-container">
          {meetingAccess === 'pending' ? (
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
          {remoteCameraOn && (
            <div className="video-pre-view-cont">
              <div className="video-pre-view" ref={remoteVideoRef} style={{ width: '100%', height: '100%' }} />
            </div>
          )}
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
      <ChatComponent
        clientId={currentUser.uid}
        channelId={meetingParams.channelId}
      />
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
