// Card.jsx
import React from "react";
import "./card.css"; // Ensure you have CSS styles for the card

const Card = ({ medicine, handleAddToCart }) => {
  return (
    <div className="card">
      <img src={medicine.imageUrl} alt={medicine.name} className="card-image" />{" "}
      {/* Medicine image */}
      <h3>{medicine.name}</h3>
      <p>{medicine.description}</p>
      <p>Price: ₹{medicine.price}</p>
      <p>Quantity: {medicine.quantity}</p>
      <button onClick={() => handleAddToCart(medicine)}><i className="fas fa-cart-plus"></i> Add to Cart</button>
    </div>
  );
};

export default Card;
