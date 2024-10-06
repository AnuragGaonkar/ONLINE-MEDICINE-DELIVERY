import React, { useState, useEffect, useContext } from "react";
import "./home.css";
import Chatbot from "../Chatbot/Chatbot";
import { CartContext } from "../Cart/CartContext";
import Card from "../card/Card"; // Import the Card component

const Home = () => {
  const { addToCart } = useContext(CartContext);
  const [alertMessage, setAlertMessage] = useState("");
  const [medicines, setMedicines] = useState([]); // State to store medicines

  // Alert component
  const Alert = ({ message, onClose }) => {
    return (
      <div className="alert">
        <span>{message}</span>
        <button onClick={onClose} className="close-alert">
          ×
        </button>
      </div>
    );
  };

  // Function to fetch medicines from API
  const getMedicines = async () => {
    const URL = "http://localhost:5001/api/medicines";
    try {
      const response = await fetch(URL);
      if (!response.ok) {
        console.log("Could not fetch medicines");
      }
      const medicines = await response.json();
      setMedicines(medicines); // Set the medicines in state
    } catch (error) {
      console.log("Internal Server error.");
    }
  };

  // Fetch medicines when the component mounts
  useEffect(() => {
    getMedicines();
  }, []);

  // Handle adding to cart and showing alert
  const handleAddToCart = (medicine) => {
    addToCart(medicine._id, 1); // Pass only medicineId and quantity to context
    setAlertMessage(`${medicine.name} has been added to your cart!`);
    setTimeout(() => setAlertMessage(""), 3000);
  };

  return (
    <div className="main">
      <main>
        <section className="hero">
          <h1>Welcome to Online Medicine Delivery</h1>
          <p>Your one-stop solution for all medical needs</p>
        </section>

        <section className="products">
          <h2>Popular Products</h2>
          <div className="product-list">
            {/* Render each medicine in a Card component */}
            {medicines.map((medicine) => (
              <Card
                key={medicine._id}
                medicine={medicine}
                handleAddToCart={handleAddToCart} // Pass handleAddToCart to Card
              />
            ))}
          </div>
        </section>

        <Chatbot />
      </main>

      {alertMessage && (
        <Alert message={alertMessage} onClose={() => setAlertMessage("")} />
      )}

      <footer>
        <p>&copy; 2024 Online Medicine Delivery. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
