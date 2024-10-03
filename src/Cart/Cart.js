import React, { useContext } from 'react';
import { CartContext } from '../Cart/CartContext';
import { useNavigate } from 'react-router-dom';
import './cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const cartTotal = cartItems.reduce((total, item) => total + parseFloat(item.price.replace('₹', '')), 0).toFixed(2);

  return (
    <div className="main">
      <div className="breadcrumb">
        <a onClick={() => navigate('/')}>Home</a> &gt; <span>Cart</span>
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
              <img src="/path-to-your-empty-cart-image.svg" alt="Empty cart" />
              <p>Your Medicine/Healthcare cart is empty!</p>
            </div>
          ) : (
            <div>
              <ul className="cart-items">
                {cartItems.map((item, index) => (
                  <li key={index} className="cart-item">
                    <img src={item.source} alt={item.name} />
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-price">{item.price}</div>
                    </div>
                    <button className="remove-button" onClick={() => removeFromCart(item.name)}>Remove</button>
                  </li>
                ))}
              </ul>
              <button className="clear-cart-button" onClick={clearCart}>Clear Cart</button>
            </div>
          )}
        </div>
        <div className="cart-right">
          <div className="cart-total">
            <span>Cart total: ₹{cartTotal}</span>
            <button disabled={cartItems.length === 0}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;