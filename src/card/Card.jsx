import React from "react";
import "./card.css";
import { useNavigate } from "react-router-dom";

const Card = ({ medicine, handleAddToCart }) => {
  const navigate = useNavigate();

  const openDetails = () => {
    if (!medicine?._id) {
      console.log("No _id on medicine:", medicine);
      return;
    }
    navigate(`/medicine/${medicine._id}`);
  };

  const onAddToCart = (e) => {
    e.stopPropagation();          // important
    handleAddToCart(medicine);
  };

  return (
    <div className="card" onClick={openDetails}>
      <img
        src={medicine.imageUrl}
        alt={medicine.name}
        className="card-image"
      />
      <h3>{medicine.name}</h3>
      <p>{medicine.description}</p>
      <p>Price: ₹{medicine.price}</p>
      <p>Quantity: {medicine.quantity}</p>
      <button onClick={onAddToCart}>
        <i className="fas fa-cart-plus"></i> Add to Cart
      </button>
    </div>
  );
};

export default Card;
