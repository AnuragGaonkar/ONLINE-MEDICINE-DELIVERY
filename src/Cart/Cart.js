// src/Cart/cart.jsx
import React, {
  useEffect,
  useContext,
  useCallback,
  useState,
} from "react";
import { CartContext } from "../Cart/CartContext";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import "./cart.css";

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    fetchCartItems,
    updateCart,
  } = useContext(CartContext);
  const navigate = useNavigate();
  const HOST = "http://localhost:5001";

  // ---- PRICE BREAKDOWN STATE (fix flicker) ----
  const [priceBreakdown, setPriceBreakdown] = useState({
    subtotal: 0,
    deliveryFee: 0,
    gstAmount: 0,
    totalPayable: 0,
    savingsText: "",
  });

  // one-time random delivery fee between 10 and 30
  const [baseDeliveryFee] = useState(() => {
    const min = 10;
    const max = 30;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  });

  const { subtotal, deliveryFee, gstAmount, totalPayable, savingsText } =
    priceBreakdown;

  const stableFetchCartItems = useCallback(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      alert("Please log in to view your cart.");
      navigate("/");
      return;
    }
    stableFetchCartItems();
  }, [stableFetchCartItems, navigate]);

  // ----- recompute fees ONLY when cartItems change -----
  useEffect(() => {
    const rawSubtotal = cartItems.reduce((total, item) => {
      const price = item.price || 0;
      return total + price * item.quantity;
    }, 0);

    // use the same baseDeliveryFee for the whole session
    let fee = 0;
    if (rawSubtotal > 0) {
      fee = baseDeliveryFee;
    }

    const gstRate = 0.05;
    const gst = +(rawSubtotal * gstRate).toFixed(2);

    const total = rawSubtotal + fee + gst;

    const savings =
      rawSubtotal === 0
        ? ""
        : "Inclusive of GST @ 5% on medicines.";

    setPriceBreakdown({
      subtotal: +rawSubtotal.toFixed(2),
      deliveryFee: fee,
      gstAmount: gst,
      totalPayable: +total.toFixed(2),
      savingsText: savings,
    });
  }, [cartItems, baseDeliveryFee]);


  const makePayment = async () => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      alert("Please log in to proceed with checkout.");
      navigate("/");
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      console.error("Cart is empty. Please add items to your cart.");
      return;
    }

    const stripe = await loadStripe(
      "pk_test_51ShmMZCwIRPtHAEdT6ZSUZqXtYJwZNebu0jl8Ij4cWmGIXzUARbiy6O4yy6YGdKLwseRvDqQJULbev9cRqKrAJQv00mMK5xjQf"
    );

    const body = {
      cartItems,
      priceBreakdown: {
        subtotal,
        deliveryFee,
        gstAmount,
        totalPayable,
      },
    };

    const headers = {
      "Content-Type": "application/json",
      "auth-token": token,
    };

    try {
      const response = await fetch(
        `${HOST}/api/payment/create-checkout-session`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Error:", response.status, errorMessage);
        alert("Payment failed: " + errorMessage);
        return;
      }

      const session = await response.json();

      if (!session.id) {
        console.error("No session ID returned. Please try again.");
        alert("No session ID returned. Please try again.");
        return;
      }

      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        console.error("Redirect to Checkout Error:", result.error.message);
        alert("Redirect to Checkout Error: " + result.error.message);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An unexpected error occurred: " + error.message);
    }
  };

  return (
    <div className="main">
      <div className="breadcrumb">
        <a onClick={() => navigate("/")}>Home</a> &gt; <span>Cart</span>
      </div>

      <div className="cart-container">
        <div className="cart-left">
          <h2>{cartItems.length} Items in your Cart</h2>
          <div className="delivery-section">
            <span>Deliver to:</span>
            <a>Select Pincode</a>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <img
                src="/path-to-your-empty-cart-image.svg"
                alt="Empty cart"
              />
              <p>Your Medicine/Healthcare cart is empty!</p>
            </div>
          ) : (
            <div>
              <ul className="cart-items">
                {cartItems.map((item, index) => (
                  <li key={index} className="cart-item">
                    <img
                      src={item.imageUrl || "/path-to-fallback-image.jpg"}
                      alt={item.name || "Medicine"}
                    />
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-price-row">
                        <span className="item-price">
                          ₹{item.price} × {item.quantity}
                        </span>
                      </div>
                      <div className="quantity-controls">
                        <button
                          onClick={() =>
                            updateCart(item.medicineId, item.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateCart(item.medicineId, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      className="remove-button"
                      onClick={() => removeFromCart(item.medicineId)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button className="clear-cart-button" onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* ---- CART SUMMARY BOX ---- */}
        <div className="cart-right">
          <div className="cart-summary">
            <h3>Cart Summary</h3>

            <div className="summary-row">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Delivery charges</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="free-delivery">Free</span>
                ) : (
                  `₹${deliveryFee.toFixed(2)}`
                )}
              </span>
            </div>

            <div className="summary-row">
              <span>GST (5%)</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>

            <hr />

            <div className="summary-row summary-total">
              <span>Amount payable</span>
              <span>₹{totalPayable.toFixed(2)}</span>
            </div>

            <p className="summary-note">{savingsText}</p>

            <button
              className="checkout-button"
              onClick={makePayment}
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </button>

            <p className="summary-disclaimer">
              This is a simulated breakdown for demo purposes. Actual taxes
              and delivery fees may vary as per government regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
