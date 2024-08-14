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
      setIsNotificationVisible(false); // Hide notification bubble after opening chat
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const userMessage = inputValue;
      setMessages([...messages, { text: userMessage, from: 'user' }]);
      setInputValue('');

      setTimeout(() => {
        const botResponse = generateResponse(userMessage);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botResponse, from: 'bot' },
        ]);
      }, 1000);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }}
    const generateResponse = (message) => {
      const patterns = [
        { pattern: /hello/i, response: "Hello! How are you feeling today?" },
        { pattern: /I need (.*)/i, response: "Why do you need $1?" },
        { pattern: /I am (.*)/i, response: "How long have you been $1?" },
        { pattern: /I can't (.*)/i, response: "What makes you think you can't $1?" },
        { pattern: /I feel (.*)/i, response: "Tell me more about feeling $1." },
        { pattern: /Why (.*)/i, response: "Why do you think $1?" },
        { pattern: /Because (.*)/i, response: "Is that the real reason?" },
        { pattern: /Yes/i, response: "I see. Can you elaborate on that?" },
        { pattern: /No/i, response: "Why not?" },
        { pattern: /you/i, response: "We should be discussing you, not me." },
        { pattern: /order medicine/i, response: "What medicine would you like to order?" },
        { pattern: /prescription/i, response: "Please upload your prescription so we can process your order." },
        { pattern: /delivery time/i, response: "When would you like your medicine delivered? We offer same-day delivery in select areas." },
        { pattern: /contactless delivery/i, response: "Yes, we offer contactless delivery. Would you like to opt for that?" },
        { pattern: /refill (.*)/i, response: "Would you like to refill your $1 prescription? Please provide the details." },
        { pattern: /urgent/i, response: "For urgent orders, we recommend using our express delivery option." },
        { pattern: /medicine (.*)/i, response: "We have $1 available. Would you like to add it to your cart?" },
        { pattern: /pharmacist/i, response: "Our pharmacists are available for consultation. Would you like to speak with one?" },
        { pattern: /track order/i, response: "You can track your order using the tracking number sent to your email." },
        { pattern: /(.*)/i, response: "Can you please provide more details? I'm here to help with your medicine delivery." },
      ];

      for (const { pattern, response } of patterns) {
        if (pattern.test(message)) {
          return message.replace(pattern, response);
        }
      }
  
      return "Can you tell me more?";
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
