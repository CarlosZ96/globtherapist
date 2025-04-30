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
  const { getUsername } = useAuth();
  const [usernames, setUsernames] = useState({});

  const getRtmToken = async (uid) => {
    try {
      const response = await fetch(
        `${functionsBaseUrl}/createAgoraChatToken?userId=${uid}&channelId=${channelId}`,
      );
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error fetching RTM token:', error);
      throw error;
    }
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
        await channel.current.join();

        channel.current.on('ChannelMessage', async (msg, memberId) => {
          const username = await getUsername(memberId);
          setUsernames((prev) => ({ ...prev, [memberId]: username }));
          // eslint-disable-next-line max-len
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), senderId: memberId, text: msg.text }]);
        });

        setIsConnected(true);
      } catch (error) {
        console.error('RTM Error:', error);
      }
    };

    if (clientId && channelId) initRTM();

    return () => {
      if (channel.current) {
        channel.current.leave();
        channel.current = null;
      }
      if (rtmClient.current) {
        rtmClient.current.logout();
        rtmClient.current = null;
      }
      setIsConnected(false);
    };
  }, [clientId, channelId]);

  const sendMessage = async () => {
    if (!message.trim() || !isConnected) return;

    try {
      await channel.current.sendMessage({ text: message });
      // eslint-disable-next-line max-len
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), senderId: clientId, text: message }]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-room-cont">
      <div className="chat-roon-txt-area">
        <div className="chat-room-users-txt">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="user-msg-cont"
            >
              <strong>
                {usernames[msg.senderId] || 'Usuario'}
                :
                {' '}
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
            type="button"
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
