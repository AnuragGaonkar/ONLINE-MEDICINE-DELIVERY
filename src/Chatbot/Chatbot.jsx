import React, { useState } from 'react';
import chatbot from './chatbot.png'; 
import './Chatbot.css';

const Chatbot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(true);
  const [messages, setMessages] = useState([{ text: 'Hello! How can I help you today?', from: 'bot' }]);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && isNotificationVisible) {
      setIsNotificationVisible(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
        const userMessage = inputValue;
        setMessages((prevMessages) => [...prevMessages, { text: userMessage, from: 'user' }]);
        setInputValue('');

        // Call the Python chatbot API
        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        });

        const data = await response.json();
        const botResponse = data.response;

        setMessages((prevMessages) => [
            ...prevMessages,
            { text: botResponse, from: 'bot' },
        ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      <div className="chatbot-icon" onClick={toggleChat}>
        <img src={chatbot} alt="Chatbot" />
        {isNotificationVisible && <div className="notification-bubble">1</div>}
      </div>
      {isChatOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Chat with us!</h3>
            <button onClick={toggleChat} className="close-chat">✖</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <p key={index} className={msg.from}>
                {msg.text}
              </p>
            ))}
          </div>
          <div className="chatbot-input">
            <input 
              type="text" 
              value={inputValue} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown}
              placeholder="Type a message..." 
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
