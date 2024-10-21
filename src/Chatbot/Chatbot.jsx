import React, { useState, useEffect } from 'react';
import chatbot from './chatbot.png';
import './Chatbot.css';

const Chatbot = ({ notifyCart }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(true);
  const [messages, setMessages] = useState([{ text: 'Hello! How can I help you today?', from: 'bot' }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [medicinesToConfirm, setMedicinesToConfirm] = useState([]);
  const [quantitiesToConfirm, setQuantitiesToConfirm] = useState([]);

  // Notify cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      notifyCart(cartItems);
    }
  }, [cartItems, notifyCart]);

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
      setIsLoading(true);
      setIsThinking(true);

      if (isConfirming) {
        handleFinalConfirmation(userMessage);
        return;
      }

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
          const botResponse = data.message;
          const medicines = data.medicines || [];

          if (botResponse.includes('add to cart')) {
            handleMedicineSelection(userMessage, medicines);
          } else {
            const medicineDetails = medicines.map(med => (med.name ? {
              text: `Medicine: ${med.name} - ${med.description} - Dosage: ${med.dosage} - Price: ₹${med.price}`,
              from: 'bot'
            } : null)).filter(Boolean);

            setMessages((prevMessages) => [
              ...prevMessages,
              { text: botResponse, from: 'bot' },
              ...medicineDetails
            ]);
          }

        } catch (error) {
          console.error('Error fetching data:', error);
          setMessages((prevMessages) => [...prevMessages, { text: "An error occurred while fetching data. Please try again.", from: 'bot' }]);
        } finally {
          setIsLoading(false);
          setIsThinking(false);
        }
      }, 1500);
    }
  };

  const handleMedicineSelection = (message, medicines) => {
    const quantities = [];
    const selectedMedicines = [];

    medicines.forEach(med => {
      const quantityMatch = message.match(new RegExp(`(${med.name})\\s*(\\d+)`, 'i'));
      if (quantityMatch) {
        selectedMedicines.push(med.name);
        quantities.push(parseInt(quantityMatch[2], 10));
      }
    });

    if (selectedMedicines.length > 0) {
      setMedicinesToConfirm(selectedMedicines);
      setQuantitiesToConfirm(quantities);
      askForFinalConfirmation(selectedMedicines, quantities);
    } else {
      promptForMedicineSelection();
    }
  };

  const promptForMedicineSelection = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: `It seems you haven't specified the medicine(s) clearly. Please mention the name of the medicine(s) you'd like to add to your cart.`, from: 'bot' }
    ]);
  };

  const askForFinalConfirmation = (medicineNames, quantities) => {
    const confirmationMessages = medicineNames.map((name, index) => `${quantities[index] || '?'} units of ${name}`).join(', ');
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: `You've selected ${confirmationMessages}. Please confirm the quantity or let me know if you'd like to add them to your cart.`, from: 'bot' }
    ]);
    setIsConfirming(true);
  };

  const handleFinalConfirmation = (responseMessage) => {
    const confirmedQuantities = quantitiesToConfirm.map(q => q || 1);

    if (responseMessage.toLowerCase() === 'yes') {
      const confirmedItems = medicinesToConfirm.map((name, index) => ({
        name,
        quantity: confirmedQuantities[index]
      }));

      confirmedItems.forEach(item => {
        setCartItems(prevItems => {
          const existingItem = prevItems.find(cartItem => cartItem.name === item.name);
          if (existingItem) {
            return prevItems.map(cartItem =>
              cartItem.name === item.name ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem
            );
          }
          return [...prevItems, { name: item.name, quantity: item.quantity }];
        });
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `The items have been added to your cart.`, from: 'bot' }
      ]);
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `Okay, feel free to explore more medicines.`, from: 'bot' }
      ]);
    }

    setIsConfirming(false);
    setMedicinesToConfirm([]);
    setQuantitiesToConfirm([]);
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
            {isThinking && <p className="thinking-message">Bot is typing<span className="dots">...</span></p>}
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
          {isConfirming && (
            <div className="confirm-add-to-cart">
              <button onClick={() => handleFinalConfirmation('yes')}>
                <i className="fas fa-cart-plus"></i> Add to Cart
              </button>
              <button onClick={() => handleFinalConfirmation('no')}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
