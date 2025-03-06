import React, { useEffect, useRef, useState } from 'react';
import AgoraRTM from 'agora-rtm-sdk';
import PropTypes from 'prop-types';

const ChatComponent = ({ clientId, channelId }) => {
  const APP_ID = process.env.REACT_APP_AGORA_APP_ID;
  const functionsBaseUrl = process.env.REACT_APP_FUNCTIONS_BASE_URL;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const rtmClient = useRef(null);
  const channel = useRef(null);

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
        rtmClient.current = AgoraRTM.createInstance(APP_ID);

        // Autenticación con token
        const token = await getRtmToken(clientId);
        await rtmClient.current.login({ uid: clientId, token });

        // Unirse al canal de video
        channel.current = rtmClient.current.createChannel(channelId);
        await channel.current.join();
        setIsConnected(true);

        // Escuchar mensajes
        channel.current.on('ChannelMessage', (message, senderId) => {
          setMessages((prev) => [...prev, { senderId, text: message.text }]);
        });
      } catch (error) {
        console.error('Error en RTM:', error);
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
    <div style={{
      width: '300px',
      border: '1px solid #ccc',
      padding: '1rem',
      margin: '1rem',
      borderRadius: '8px',
    }}
    >
      <div style={{ height: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
        {messages.map((msg) => (
          <div
            key={`${msg.senderId}-${msg.text}-${Date.now()}`}
            style={{
            textAlign: msg.senderId === clientId ? 'right' : 'left',
            margin: '0.5rem 0',
          }}
          >
            <strong>
              {msg.senderId}
              :
            </strong>
            {' '}
            {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe un mensaje..."
        style={{ width: '70%', marginRight: '0.5rem' }}
      />
      <button
        onClick={sendMessage}
        disabled={!isConnected}
      >
        Enviar
      </button>
    </div>
  );
};

ChatComponent.propTypes = {
  clientId: PropTypes.string.isRequired,
  channelId: PropTypes.string.isRequired,
};

export default ChatComponent;
