/* eslint-disable consistent-return */
/* eslint-disable new-cap */
import React, { useEffect, useState, useRef } from 'react';
import AC from 'agora-chat';

const ChatComponent = () => {
  const appKey = process.env.REACT_APP_AGORA_CHAT_APP_KEY;
  const functionsBaseUrl = process.env.REACT_APP_FUNCTIONS_BASE_URL;
  const [userId, setUserId] = useState('');
  const [setToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const chatClient = useRef(null);

  const addLog = (log) => setLogs((prev) => [...prev, log]);

  const styles = {
    container: {
      width: '500px',
      margin: '20px auto',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
    },
    loginContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    chatContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    messageSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    messageInput: {
      display: 'flex',
      gap: '10px',
    },
    input: {
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      flex: 1,
    },
    button: {
      padding: '8px 15px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    logs: {
      marginTop: '20px',
      height: '200px',
      overflowY: 'auto',
      border: '1px solid #eee',
      padding: '10px',
      borderRadius: '4px',
    },
    logEntry: {
      padding: '5px',
      borderBottom: '1px solid #eee',
    },
  };

  const handleLogin = () => {
    if (!userId.trim()) {
      addLog('Ingresa un UserID válido');
      return;
    }

    fetch(`${functionsBaseUrl}/createAgoraChatToken?userId=${encodeURIComponent(userId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.token) {
          setToken(data.token);
          chatClient.current.open({ user: userId, accessToken: data.token });
          addLog('Token obtenido!');
        } else {
          addLog(`Error en respuesta: ${JSON.stringify(data)}`);
        }
      })
      .catch((err) => addLog(`Error: ${err.message}`));
  };

  const handleLogout = () => {
    chatClient.current?.close();
    setIsLoggedIn(false);
    setUserId('');
    setPeerId('');
    addLog('Sesión cerrada');
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !peerId.trim()) return;

    try {
      const msg = AC.message.create({
        chatType: 'singleChat',
        type: 'txt',
        to: peerId,
        msg: message,
      });
      await chatClient.current.send(msg);
      addLog(`Mensaje a ${peerId}: ${message}`);
      setMessage('');
    } catch (error) {
      addLog(`Error enviando mensaje: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!appKey) {
      addLog('ERROR: AppKey no configurado');
      return;
    }

    chatClient.current = new AC.connection({ appKey });

    const handler = {
      onConnected: () => {
        setIsLoggedIn(true);
        addLog('Conectado!');
      },
      onDisconnected: () => {
        setIsLoggedIn(false);
        addLog('Desconectado');
      },
      onTextMessage: (msg) => addLog(`${msg.from}: ${msg.msg}`),
      onTokenWillExpire: () => addLog('Token por expirar'),
      onTokenExpired: () => addLog('Token expirado'),
      onError: (err) => addLog(`ERROR: ${err.message}`),
    };

    chatClient.current.addEventHandler('connection&message', handler);

    return () => {
      chatClient.current?.removeEventHandler('connection&message');
      chatClient.current?.close();
    };
  }, [appKey]);

  return (
    <div style={styles.container}>
      <h2>Agora Chat</h2>

      {!isLoggedIn ? (
        <div style={styles.loginContainer}>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Tu UserID"
            style={styles.input}
          />
          <button type="button" onClick={handleLogin} style={styles.button}>
            Conectar
          </button>
        </div>
      ) : (
        <div style={styles.chatContainer}>
          <div style={styles.header}>
            <h3>
              Usuario:
              {userId}
            </h3>
            <button type="button" onClick={handleLogout} style={styles.button}>
              Salir
            </button>
          </div>

          <div style={styles.messageSection}>
            <input
              type="text"
              value={peerId}
              onChange={(e) => setPeerId(e.target.value)}
              placeholder="ID del receptor"
              style={styles.input}
            />
            <div style={styles.messageInput}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje"
                style={styles.input}
              />
              <button type="button" onClick={handleSendMessage} style={styles.button}>
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.logs}>
        {logs.map((log) => (
          <div key={log + Math.random()} style={styles.logEntry}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default ChatComponent;
