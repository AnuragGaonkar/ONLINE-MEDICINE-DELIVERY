// src/PaymentSuccess/PaymentSuccess.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../Cart/CartContext";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useContext(CartContext);

  const [orderSummary, setOrderSummary] = useState({
    email: "",
    amount: 0,        // in paise
    currency: "INR",
    items: [],
  });

  // clear cart on successful payment
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // restore summary from localStorage or URL
  useEffect(() => {
    const stored = localStorage.getItem("last-order-summary");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setOrderSummary(parsed);
        return;
      } catch (_) {
        // ignore parse error and fall back to URL params
      }
    }

    const params = new URLSearchParams(location.search);
    const email = params.get("email") || "";
    const amount = Number(params.get("amount") || 0);

    if (email || amount) {
      setOrderSummary((prev) => ({ ...prev, email, amount }));
    }
  }, [location.search]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleViewOrders = () => {
    // Profile page should read ?tab=orders and open Orders tab
    navigate("/profile?tab=orders");
  };

  return (
    <div className="payment-success-page">
      <div className="payment-card">
        <div className="payment-icon">✔</div>
        <h1>Order successfully placed</h1>
        <p className="payment-text">
          A confirmation has been sent to{" "}
          <span className="highlight">
            {orderSummary.email || "your registered email"}
          </span>
          .
        </p>

        <div className="summary-box">
          <h2>Order summary</h2>
          <p className="summary-line">
            Amount paid:{" "}
            <strong>₹{(orderSummary.amount / 100).toFixed(2)}</strong>
          </p>
          {orderSummary.items && orderSummary.items.length > 0 && (
            <ul className="summary-list">
              {orderSummary.items.map((item, idx) => (
                <li key={idx}>
                  <span>{item.name}</span>
                  <span>× {item.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="button-row">
          <button className="primary-btn" onClick={handleGoHome}>
            Go to Home
          </button>
          <button className="secondary-btn" onClick={handleViewOrders}>
            View your orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
