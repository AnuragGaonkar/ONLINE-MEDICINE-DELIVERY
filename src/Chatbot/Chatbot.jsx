import React, { useState } from 'react';
import chatbot from './chatbot.png'; 
import './Chatbot.css';

const Chatbot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(true);
  const [messages, setMessages] = useState([{ text: 'Hello! How can I help you today?', from: 'bot' }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // State to show thinking animation

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
      setIsLoading(true); // Set loading state
      setIsThinking(true); // Set thinking state

      // Simulate a delay for the bot response
      setTimeout(async () => {
        try {
          const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const botResponse = data.message; // Get the response message from backend
          const medicines = data.medicines || []; // Medicines are returned as an array

          // Adding the bot response to messages
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: botResponse, from: 'bot' },
            ...medicines.map(med => ({ text: `Medicine: ${med.name} - ${med.description} - Dosage: ${med.dosage}`, from: 'bot' })),
          ]);
        } catch (error) {
          console.error('Error fetching data:', error);
          setMessages((prevMessages) => [...prevMessages, { text: "An error occurred while fetching data. Please try again.", from: 'bot' }]);
        } finally {
          setIsLoading(false); // Reset loading state
          setIsThinking(false); // Reset thinking state after showing response
        }
      }, 1500); // Simulate a 1.5-second delay before processing the bot's response
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
              <div key={index} className={`message ${msg.from}`}>
                <p className={msg.from === 'bot' ? 'bot-response' : 'user-response'}>{msg.text}</p>
              </div>
            ))}
            {isThinking && <p className="thinking-message">Bot is typing<span className="dots">...</span></p>} {/* Typing animation */}
          </div>
          <div className="chatbot-input">
            <input 
              type="text" 
              value={inputValue} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown}
              placeholder="Type a message..." 
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
