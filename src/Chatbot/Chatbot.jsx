import React, { useState, useEffect, useRef, useContext } from "react";
import chatbot from "./chatbot.png";
import "./Chatbot.css";
import { CartContext } from "../Cart/CartContext";

// Backend base URLs
const API_HOST = "https://mediquick-backend-yizx.onrender.com";
const CHATBOT_HOST = "https://mediquick-chatbot.onrender.com";

const Chatbot = ({ notifyCart }) => {
  const [hasToken, setHasToken] = useState(
    !!localStorage.getItem("auth-token")
  );
  const { addToCart } = useContext(CartContext);

  const [sessionId, setSessionId] = useState(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(true);

  // default greeting – used only when there is no history
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", from: "bot" },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [medicinesToConfirm, setMedicinesToConfirm] = useState([]);
  const [quantitiesToConfirm, setQuantitiesToConfirm] = useState([]);

  const messagesEndRef = useRef(null);

  // ---- derive stable sessionId from JWT once ----
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;

    try {
      // JWT is 3 parts; payload is the middle, base64url encoded
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      // token shape: { user: { id: "<mongoId>" }, iat: ... }
      const uid = payload?.user?.id;
      if (uid) {
        setSessionId(uid);
      } else {
        // fallback: use the token itself
        setSessionId(token);
      }
    } catch (e) {
      // on any parsing error, use token as sessionId
      setSessionId(token);
    }
  }, []);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // listen for global auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem("auth-token");
      setHasToken(!!token);

      if (!token) {
        setSessionId(null);
        setMessages([
          { text: "Hello! How can I help you today?", from: "bot" },
        ]);
      }
    };
    window.addEventListener("auth-changed", handleAuthChange);
    return () =>
      window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  // ---- LOCAL CACHE LOAD (fallback until backend arrives) ----
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("chatbot-messages");
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // ensure greeting is always first even from cache
          const withoutGreeting = parsed.filter(
            (m) =>
              !(
                m.from === "bot" &&
                m.text.startsWith("Hello! How can I help you today?")
              )
          );
          const withGreeting = [
            { text: "Hello! How can I help you today?", from: "bot" },
            ...withoutGreeting,
          ];
          setMessages(withGreeting);
        }
      }

      const savedCartItems = localStorage.getItem("chatbot-cart-items");
      if (savedCartItems) {
        const parsedCart = JSON.parse(savedCartItems);
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart);
        }
      }
    } catch (err) {
      console.error("Error reading chatbot data from localStorage:", err);
    }
  }, []);

  // ---- LOAD HISTORY FROM BACKEND ONCE sessionId IS READY ----
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token || !sessionId) return;

    const fetchBackendHistory = async () => {
      try {
        const res = await fetch(`${CHATBOT_HOST}/chat_history`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Session-Id": sessionId,
          },
        });

        if (!res.ok) return;

        const data = await res.json(); // list of { user_message, bot_message, ... }

        const historyMessages = data.flatMap((d) => [
          { text: d.user_message, from: "user" },
          { text: d.bot_message, from: "bot" },
        ]);

        // always keep greeting at the very top
        const withGreeting = [
          { text: "Hello! How can I help you today?", from: "bot" },
          ...historyMessages,
        ];

        setMessages(withGreeting);
        localStorage.setItem(
          "chatbot-messages",
          JSON.stringify(withGreeting)
        );
      } catch (err) {
        console.warn("Backend history fetch failed, using local cache");
      }
    };

    fetchBackendHistory();
  }, [sessionId]);

  // persist messages
  useEffect(() => {
    localStorage.setItem("chatbot-messages", JSON.stringify(messages));
  }, [messages]);

  // persist cart
  useEffect(() => {
    localStorage.setItem("chatbot-cart-items", JSON.stringify(cartItems));
  }, [cartItems]);

  // notify parent cart
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    if (cartItems.length > 0 && typeof notifyCart === "function") {
      notifyCart(cartItems);
    }
  }, [cartItems, notifyCart]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && isNotificationVisible) {
      setIsNotificationVisible(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const userMessage = inputValue;
    setMessages((prev) => [...prev, { text: userMessage, from: "user" }]);
    setInputValue("");
    setIsLoading(true);
    setIsThinking(true);

    if (isConfirming) {
      handleFinalConfirmation(userMessage);
      setIsLoading(false);
      setIsThinking(false);
      return;
    }

    try {
      const response = await fetch(`${CHATBOT_HOST}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          "X-Session-Id": sessionId,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.message) {
        setMessages((prev) => [...prev, { text: data.message, from: "bot" }]);
      }

      /* 2️⃣ Handle ADD TO CART from chatbot */
      if (data.type === "ADD_TO_CART" && Array.isArray(data.items)) {
        data.items.forEach((item) => {
          // item.name -> medicine name
          // item.quantity -> quantity
          addToCart(item.name, item.quantity);
        });
      }

      /* 3️⃣ Handle PROCEED TO CHECKOUT */
      if (data.type === "PROCEED_TO_CHECKOUT") {
        window.location.href = "/cart";
      }

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "An error occurred. Please try again.", from: "bot" },
      ]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const handleFinalConfirmation = (responseMessage) => {
    if (responseMessage.toLowerCase() === "yes") {
      setMessages((prev) => [
        ...prev,
        { text: "The items have been added to your cart.", from: "bot" },
      ]);
      // if later you want to actually hit the Node cart API, you’ll use API_HOST here
    } else {
      setMessages((prev) => [
        ...prev,
        { text: "Okay, feel free to explore more medicines.", from: "bot" },
      ]);
    }

    setIsConfirming(false);
    setMedicinesToConfirm([]);
    setQuantitiesToConfirm([]);
  };

  if (!hasToken) return null;

  return (
    <>
      <div className="chatbot-icon" onClick={toggleChat}>
        <img src={chatbot} alt="Chatbot" />
        {isNotificationVisible && (
          <div className="notification-bubble">1</div>
        )}
      </div>

      {isChatOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Chat with us!</h3>
            <button onClick={toggleChat} className="close-chat">
              ✖
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.from}`}>
                <pre
                  className={
                    msg.from === "bot" ? "bot-response" : "user-response"
                  }
                >
                  {msg.text}
                </pre>
              </div>
            ))}
            {isThinking && (
              <p className="thinking-message">Bot is typing...</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
