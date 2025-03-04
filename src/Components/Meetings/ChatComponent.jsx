/* eslint-disable new-cap */
/* eslint-disable consistent-return */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState, useRef } from 'react';
import AC from 'agora-chat';

const ChatComponent = () => {
  const appKey = process.env.REACT_APP_AGORA_CHAT_APP_KEY;
  const functionsBaseUrl = process.env.REACT_APP_FUNCTIONS_BASE_URL;
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const chatClient = useRef(null);

  const addLog = (log) => {
    setLogs((prevLogs) => [...prevLogs, log]);
  };

  // Función para iniciar sesión en Agora Chat obteniendo el token desde Firebase Functions
  const handleLogin = () => {
    if (userId.trim() === '') {
      addLog('Por favor, ingresa tu UserID');
      return;
    }
    console.log('Enviando userId:', userId);
    // Llama al endpoint para obtener el token de chat
    fetch(`${functionsBaseUrl}/createAgoraToken/createAgoraChatToken?userId=${userId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          setToken(data.token);
          addLog('Token de chat obtenido correctamente');
          // Abre la conexión utilizando el token real
          chatClient.current.open({
            user: userId,
            accessToken: data.token,
          });
        } else {
          addLog(`Error al obtener token: ${JSON.stringify(data)}`);
        }
      })
      .catch((error) => {
        addLog(`Error al llamar al endpoint de token: ${error.message}`);
      });
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    if (chatClient.current) {
      chatClient.current.close();
    }
    setIsLoggedIn(false);
    setUserId('');
    setPeerId('');
    addLog('Logout exitoso');
  };

  // Función para enviar un mensaje peer-to-peer
  const handleSendMessage = async () => {
    if (message.trim() === '') {
      addLog('Por favor ingresa contenido en el mensaje');
      return;
    }
    try {
      const option = {
        chatType: 'singleChat',
        type: 'txt',
        to: peerId,
        msg: message,
      };
      const msgObj = AC.message.create(option);
      await chatClient.current.send(msgObj);
      addLog(`Mensaje enviado a ${peerId}: ${message}`);
      setMessage('');
    } catch (error) {
      addLog(`Error al enviar mensaje: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!appKey) {
      addLog('No se encontró agora.chat_app_id');
      return;
    }
    // Usar "AC.connection" (en minúscula) para crear la conexión
    chatClient.current = new AC.connection({ appKey });
    chatClient.current.addEventHandler('connection&message', {
      onConnected: () => {
        setIsLoggedIn(true);
        addLog(`Usuario ${userId} conectado exitosamente`);
      },
      onDisconnected: () => {
        setIsLoggedIn(false);
        addLog('Desconectado');
      },
      onTextMessage: (msg) => {
        addLog(`${msg.from}: ${msg.msg}`);
      },
      onTokenWillExpire: () => {
        addLog('El token está a punto de expirar');
      },
      onTokenExpired: () => {
        addLog('El token ha expirado');
      },
      onError: (error) => {
        addLog(`Error: ${error.message}`);
      },
    });

    return () => {
      if (chatClient.current) {
        chatClient.current.close();
      }
    };
  }, [appKey, userId]);

  return (
    <div
      style={{
        width: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        border: '1px solid #ccc',
        padding: '10px',
        marginTop: '1rem',
      }}
    >
      <h2>Agora Chat</h2>
      {!isLoggedIn ? (
        <>
          <div>
            <label>UserID: </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Ingresa tu UserID"
            />
          </div>
          <button type="button" onClick={handleLogin}>Login Chat</button>
        </>
      ) : (
        <>
          <h3>
            Bienvenido,
            {' '}
            {userId}
          </h3>
          <p>
            Token generado:
            {' '}
            {token}
          </p>
          <button type="button" onClick={handleLogout}>Logout Chat</button>
          <div>
            <label>Peer UserID: </label>
            <input
              type="text"
              value={peerId}
              onChange={(e) => setPeerId(e.target.value)}
              placeholder="Ingresa UserID del receptor"
            />
          </div>
          <div>
            <label>Mensaje: </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje"
            />
            <button type="button" onClick={handleSendMessage}>Enviar</button>
          </div>
        </>
      )}
      <h3>Logs de Operación</h3>
      <div
        style={{
          height: '150px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '5px',
          textAlign: 'left',
        }}
      >
        {logs.map((log) => (
          <div key={log + Math.random().toString(36).substr(2, 9)}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default ChatComponent;
