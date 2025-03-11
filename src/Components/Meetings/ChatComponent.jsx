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

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const rtmClient = useRef(null);
  const channel = useRef(null);
  const { getUsername } = useAuth(); // Función que obtiene el nombre desde Firebase
  const [usernames, setUsernames] = useState({});

  const fetchUsername = async (uid) => {
    if (!usernames[uid]) {
      const name = await getUsername(uid); // Implementa esta función en AuthContext
      setUsernames((prev) => ({ ...prev, [uid]: name }));
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchUsername(clientId); // Precarga el nombre del usuario actual (quien envía mensajes)
    }
  }, [clientId]); // Se ejecuta cuando clientId cambia

  // Inicializar RTM (useEffect existente)
  useEffect(() => {
    const initRTM = async () => { /* ... */ };
    if (clientId && channelId) initRTM();
    return () => { /* ... */ };
  }, [clientId, channelId]);
  // Obtener token RTM desde Firebase
  const getRtmToken = async (uid) => {
    const response = await fetch(
      `${functionsBaseUrl}/createAgoraChatToken?userId=${uid}&channelId=${channelId}`,
    );
    const data = await response.json();
    return data.token;
  };

  // Inicializar RTM
  useEffect(() => {
    const initRTM = async () => {
      try {
        // Inicializa el cliente RTM con modo "rtm"
        rtmClient.current = AgoraRTM.createInstance(APP_ID, {
          enableLogUpload: false,
          logFilter: AgoraRTM.LOG_FILTER_OFF,
        });

        // Autenticación con token (usando tu función getRtmToken)
        const token = await getRtmToken(clientId);
        await rtmClient.current.login({ uid: clientId, token });

        // Únete al canal (mismo que la videollamada)
        channel.current = rtmClient.current.createChannel(channelId);
        await channel.current.join();

        // Escucha mensajes
        channel.current.on('ChannelMessage', async (msg, memberId) => {
          const username = await getUsername(memberId); // Obtén el nombre primero
          setUsernames((prev) => ({ ...prev, [memberId]: username }));
          setMessages((prev) => [...prev, { senderId: memberId, text: msg.text }]);
        });

        setIsConnected(true);
      } catch (error) {
        if (!error.message.includes('webcollector-rtm.agora.io')) {
          console.error('Error RTM:', error);
        }
      }
    };

    if (clientId && channelId) initRTM();

    // Limpiar al desmontar
    return () => {
      if (channel.current) channel.current.leave();
      if (rtmClient.current) rtmClient.current.logout();
    };
  }, [clientId, channelId]);

  // Enviar mensaje
  const sendMessage = async () => {
    if (!message.trim() || !isConnected) return;

    try {
      await channel.current.sendMessage({ text: message });
      setMessages((prev) => [...prev, { senderId: clientId, text: message }]);
      setMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  return (
    <div className="chat-room-cont">
      <div className="chat-roon-txt-area">
        <div className="chat-room-users-txt">
          {messages.map((msg) => (
            <div
              className="user-msg-cont"
              key={`${msg.senderId}-${msg.text}-${Date.now()}`}
            >
              <strong>
                {`${usernames[msg.senderId] || 'Cargando...'}:`}
                {' '}
              </strong>
              <p>
                {msg.text}
              </p>
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
          />
          <button className="chat-btn" onClick={sendMessage} disabled={!isConnected}>
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
