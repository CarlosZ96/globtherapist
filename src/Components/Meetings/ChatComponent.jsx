import React, { useEffect, useState, useRef } from 'react';
import AC from 'agora-chat';

const ChatComponent = () => {
  const appKey = process.env.REACT_APP_AGORA_CHAT_APP_KEY; // Tu App Key para Chat
  const [userId, setUserId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const chatClient = useRef(null);

  // Función para agregar mensajes al log
  const addLog = (log) => {
    setLogs((prevLogs) => [...prevLogs, log]);
  };

  // Inicia sesión en Agora Chat
  const handleLogin = () => {
    if (userId && accessToken) {
      chatClient.current.open({
        user: userId,
        // Para versiones 1.2.2 y posteriores se utiliza accessToken en lugar de agoraToken
        accessToken,
      });
    } else {
      addLog('Por favor ingresa UserID y Token.');
    }
  };

  // Cierra la sesión
  const handleLogout = () => {
    if (chatClient.current) {
      chatClient.current.close();
      setIsLoggedIn(false);
      addLog('Logout exitoso.');
    }
    setUserId('');
    setAccessToken('');
    setPeerId('');
  };

  // Envía un mensaje peer-to-peer
  const handleSendMessage = async () => {
    if (message.trim() && peerId.trim()) {
      try {
        const option = {
          chatType: 'singleChat', // Chat uno a uno
          type: 'txt', // Tipo de mensaje: texto
          to: peerId, // Destinatario
          msg: message, // Contenido del mensaje
        };
        const msgObj = AC.message.create(option);
        await chatClient.current.send(msgObj);
        addLog(`Mensaje enviado a ${peerId}: ${message}`);
        setMessage('');
      } catch (error) {
        addLog(`Error al enviar mensaje: ${error.message}`);
      }
    } else {
      addLog('Por favor ingresa contenido y PeerID.');
    }
  };

  useEffect(() => {
    // Inicializa la conexión con Agora Chat
    if (!appKey) {
      console.error('No se encontró REACT_APP_AGORA_CHAT_APP_KEY');
      return;
    }
    chatClient.current = new AC.Connection({ appKey });
    chatClient.current.addEventHandler('connection&message', {
      onConnected: () => {
        setIsLoggedIn(true);
        addLog(`Usuario ${userId} conectado correctamente.`);
      },
      onDisconnected: () => {
        setIsLoggedIn(false);
        addLog('Desconectado.');
      },
      onTextMessage: (message) => {
        addLog(`${message.from}: ${message.msg}`);
      },
      onTokenWillExpire: () => {
        addLog('El token está a punto de expirar.');
      },
      onTokenExpired: () => {
        addLog('El token ha expirado.');
      },
      onError: (error) => {
        addLog(`Error: ${error.message}`);
      },
    });
  }, [appKey, userId]);

  return (
    <div style={{
      width: '300px',
      padding: '1rem',
      border: '1px solid #ccc',
      borderRadius: '0.5rem',
      backgroundColor: '#fff',
      position: 'absolute',
      bottom: '1rem',
      right: '1rem',
      zIndex: 100,
    }}
    >
      <h3>Chat Agora</h3>
      {!isLoggedIn ? (
        <>
          <div>
            <label>UserID: </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Ingresa tu UserID"
            />
          </div>
          <div>
            <label>Token: </label>
            <input
              type="text"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Ingresa el Token"
            />
          </div>
          <button type="button" onClick={handleLogin}>Login</button>
        </>
      ) : (
        <>
          <div style={{ marginBottom: '0.5rem' }}>
            <p>
              Bienvenido,
              {userId}
            </p>
            <button type="button" onClick={handleLogout}>Logout</button>
          </div>
          <div>
            <label>PeerID: </label>
            <input
              type="text"
              value={peerId}
              onChange={(e) => setPeerId(e.target.value)}
              placeholder="Destinatario"
            />
          </div>
          <div>
            <label>Mensaje: </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensaje"
            />
            <button type="button" onClick={handleSendMessage}>Enviar</button>
          </div>
        </>
      )}
      <div style={{
        marginTop: '1rem',
        maxHeight: '150px',
        overflowY: 'auto',
        border: '1px solid #eee',
        padding: '0.5rem',
        fontSize: '0.85rem',
        backgroundColor: '#f9f9f9',
      }}
      >
        <h4>Logs</h4>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default ChatComponent;
