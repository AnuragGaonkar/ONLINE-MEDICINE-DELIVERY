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
  const [cartItems, setCartItems] = useState([]); // To track items for cart
  const [isConfirming, setIsConfirming] = useState(false); // Track if bot is awaiting confirmation
  const [medicineToConfirm, setMedicineToConfirm] = useState(null); // Store medicine to confirm
  const [quantityToConfirm, setQuantityToConfirm] = useState(null); // Store quantity to confirm

  useEffect(() => {
    if (cartItems.length > 0) {
      notifyCart(cartItems); // Notify Home/Cart component when cartItems are updated
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
      setIsLoading(true); // Set loading state
      setIsThinking(true); // Set thinking state

      // Handle final confirmation response if awaiting user input for confirmation
      if (isConfirming) {
        handleFinalConfirmation(userMessage);
        return;
      }

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

          // Handle medicine selection process
          if (userMessage.toLowerCase().includes('prescribe')) {
            handleMedicineSelection(userMessage, medicines);
          } else {
            // Check if the bot response includes any medicine details
            const medicineDetails = medicines.map(med => ({
              text: `Medicine: ${med.name} - ${med.description} - Dosage: ${med.dosage} - Price: ₹${med.price}`,
              from: 'bot'
            }));

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
          setIsLoading(false); // Reset loading state
          setIsThinking(false); // Reset thinking state after showing response
        }
      }, 1500); // Simulate a 1.5-second delay before processing the bot's response
    }
  };

  const handleMedicineSelection = (message, medicines) => {
    // Parse quantity if mentioned in the message
    const quantityMatch = message.match(/(\d+)\s*(units?|pills?|tablets?)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : null;

    const selectedMedicine = medicines.length > 0 ? medicines[0] : null; // Assuming the first match
    if (selectedMedicine) {
      const medicineName = selectedMedicine.name;

      if (quantity) {
        // If the user provided quantity, ask for final confirmation
        askForFinalConfirmation(medicineName, quantity);
      } else {
        // Ask for quantity if not provided
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: `How many units of ${medicineName} would you like to add to the cart?`, from: 'bot' }
        ]);
      }
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `Sorry, I couldn't find any medicine matching your request.`, from: 'bot' }
      ]);
    }
  };

  const askForFinalConfirmation = (medicineName, quantity) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: `You've selected ${quantity} units of ${medicineName}. Should I add it to your cart?`, from: 'bot' }
    ]);
    setMedicineToConfirm(medicineName); // Store the selected medicine
    setQuantityToConfirm(quantity); // Store the quantity
    setIsConfirming(true); // Set confirmation state
  };

  const handleFinalConfirmation = (responseMessage) => {
    if (responseMessage.toLowerCase() === 'yes') {
      // Add selected medicines to cart and notify cart
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `The items have been added to your cart.`, from: 'bot' }
      ]);
      // Add the confirmed item to the cart
      setCartItems(prevItems => [...prevItems, { name: medicineToConfirm, quantity: quantityToConfirm }]);
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `Okay, feel free to explore more medicines.`, from: 'bot' }
      ]);
    }
    setIsConfirming(false); // Reset confirmation state
    setMedicineToConfirm(null); // Reset stored medicine
    setQuantityToConfirm(null); // Reset stored quantity
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
        </div>
      )}
    </>
  );
};

export default Chatbot;
