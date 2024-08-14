import React, { useContext, useState } from 'react';
import { CartContext } from '../Cart/CartContext';
import { useNavigate } from 'react-router-dom';
import Login from '../Login/login';
import './cart.css';


const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isSlider, setIsSlider] = useState(false); 

  const openSlider = () => {
    setIsSlider(!isSlider);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);


  return (
    <div className="main">
      <header>
        <div className="logo" onClick={() => navigate('/')}>Online Medicine Delivery</div>
        <form className="search-form">
            <input type="text" placeholder="Search for Medicines/Healthcare products" />
            <button type="submit"><i className="bi bi-search"></i><span className="search-text">Search</span></button>
        </form>
        <button onClick={openSlider} className="menu-toggle" aria-label="Toggle menu">☰</button>
        <nav className="main-nav">
          <ul>
            <li><a onClick={openModal}><i className="bi bi-person"></i>Login</a></li>
            <li><a href="#"><i className="bi bi-percent"></i>Offers</a></li>
            <li><a onClick={() => navigate('/cart')}><i className="bi bi-cart"></i>Cart</a></li>
          </ul>
        </nav>
      </header>

      {isSlider && (
        <div className="slide-menu">
          <ul>
            <li><a onClick={openModal}><i className="bi bi-person"></i>Login</a></li>
            <li><a href="#"><i className="bi bi-percent"></i>Offers</a></li>
            <li><a onClick={() => navigate('/cart')}><i className="bi bi-cart"></i>Cart</a></li>
          </ul>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <Login />
          </div>
        </div>
      )}

      <div className="breadcrumb">
        <a onClick={() => navigate('/')}>Home</a> &gt; <span>Cart</span>
      </div>

      <h2>{cartItems.length} Items in your Cart</h2>

      {cartItems.length === 0 ? (
        <div>Your cart is empty!</div>
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
  );
};

export default Cart;
