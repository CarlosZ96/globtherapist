/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/button-has-type */
import React, { useEffect, useRef, useState } from 'react';
import AgoraRTM from 'agora-rtm-sdk';
import PropTypes from 'prop-types';
import { useAuth } from '../../AuthContext';
import sub from '../../img/submit.png';

const ChatComponent = ({ clientId, channelId }) => {
  const APP_ID = process.env.REACT_APP_AGORA_APP_ID;
  const functionsBaseUrl = process.env.REACT_APP_FUNCTIONS_BASE_URL;
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const rtmClient = useRef(null);
  const channel = useRef(null);
  const { getUsername } = useAuth();
  const [usernames, setUsernames] = useState({});

  const fetchUsername = async (uid) => {
    if (!usernames[uid]) {
      const name = await getUsername(uid);
      setUsernames((prev) => ({ ...prev, [uid]: name }));
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchUsername(clientId);
    }
  }, [clientId]);

  const getRtmToken = async (uid) => {
    const response = await fetch(
      `${functionsBaseUrl}/createAgoraChatToken?userId=${uid}&channelId=${channelId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  };

  useEffect(() => {
    const initRTM = async () => {
      try {
        rtmClient.current = AgoraRTM.createInstance(APP_ID, {
          enableLogUpload: false,
          logFilter: AgoraRTM.LOG_FILTER_OFF,
        });

        const token = await getRtmToken(clientId);
        await rtmClient.current.login({ uid: clientId, token });

        channel.current = rtmClient.current.createChannel(channelId);
        await channel.current.join({
          withMessage: true,
        });

        rtmClient.current.on('ConnectionStateChanged', (newState, reason) => {
          console.log('Estado conexión RTM:', newState, 'Razón:', reason);
          setConnectionState(newState);

          if (newState === 'DISCONNECTED') {
            console.log('Reconectando...');
            setTimeout(initRTM, 5000);
          }
        });

        rtmClient.current.on('TokenExpired', async () => {
          try {
            const newToken = await getRtmToken(clientId);
            await rtmClient.current.renewToken(newToken);
            console.log('Token renovado exitosamente');
          } catch (renewError) {
            console.error('Error renovando token:', renewError);
          }
        });

        channel.current.on('ChannelMessage', async (Message, memberId) => {
          if (!usernames[memberId]) {
            const name = await getUsername(memberId);
            setUsernames((prev) => ({ ...prev, [memberId]: name }));
          }

          setMessages((prev) => [...prev, {
            senderId: memberId,
            text: Message.text,
            timestamp: Date.now(),
          }]);
        });

        setIsConnected(true);
        console.log('Conexión RTM establecida correctamente');
      } catch (error) {
        console.error('Error RTM:', error);
        setTimeout(initRTM, 5000);
      }
    };

    if (clientId && channelId) initRTM();

    return () => {
      if (channel.current) {
        channel.current.leave().catch((e) => console.error('Error al salir del canal:', e));
      }
      if (rtmClient.current) {
        rtmClient.current.logout().catch((e) => console.error('Error al cerrar sesión:', e));
      }
    };
  }, [clientId, channelId]);

  const sendMessage = async () => {
    if (!message.trim() || !isConnected) return;

    try {
      await channel.current.sendMessage({
        text: message,
      });

      setMessages((prev) => [...prev, {
        senderId: clientId,
        text: message,
        timestamp: Date.now(),
      }]);

      setMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);

      if (error.code === 'RTM_CHANNEL_NOT_JOINED') {
        console.warn('Reintentando unirse al canal...');
        try {
          await channel.current.join();
          await channel.current.sendMessage({ text: message });
        } catch (rejoinError) {
          console.error('Error al reenviar:', rejoinError);
        }
      }
    }
  };

  return (
    <div className="chat-room-cont">
      {connectionState !== 'CONNECTED' && (
        <div className="connection-warning">
          Estado conexión:
          {' '}
          {connectionState}
        </div>
      )}
      <div className="chat-roon-txt-area">
        <div className="chat-room-users-txt">
          {messages.map((msg) => (
            <div
              className="user-msg-cont"
              key={`${msg.senderId}-${msg.timestamp}`}
            >
              <strong>
                {`${usernames[msg.senderId] || 'Cargando...'}: `}
              </strong>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>
        <div className="chat-txt-field-cont">
          <input
            className="chat-txt-field"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            className="chat-btn"
            onClick={sendMessage}
            disabled={!isConnected}
          >
            <img src={sub} alt="Enviar mensaje" />
          </button>
        </div>
      </div>
    </div>
  );
};

ChatComponent.propTypes = {
  clientId: PropTypes.string.isRequired,
  channelId: PropTypes.string.isRequired,
};

export default ChatComponent;
