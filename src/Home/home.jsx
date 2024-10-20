import React, { useState, useEffect, useContext } from "react";
import "./home.css";
import Chatbot from "../Chatbot/Chatbot";
import { CartContext } from "../Cart/CartContext";
import Card from "../card/Card";
import one from './comp_india_covered.jpg';
import two from './comp_cod.jpg';
import three from './safe.jpg';
import four from './del.png';

const Home = () => {
  const { addToCart } = useContext(CartContext);
  const [alertMessage, setAlertMessage] = useState("");
  const [medicines, setMedicines] = useState([]); // State to store medicines
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  // Alert component
  const Alert = ({ message, onClose }) => {
    return (
      <div className="alert" style={{ zIndex: 1001 }}>
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

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter medicines based on search term
  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main">
      <h1>Welcome to Online Medicine Delivery</h1> {/* Moved h1 above hero section */}
      <main>
        <section className="hero">
          {/* Slideshow Container */}
          <div className="slideshow-container">
            <img
              src={one}
              alt="Slideshow 1"
              className="slideshow-image"
            />
            <img
              src={two}
              alt="Slideshow 2"
              className="slideshow-image"
            />
            <img
              src={three}
              alt="Slideshow 3"
              className="slideshow-image"
            />
            <img
              src={four}
              alt="Slideshow 4"
              className="slideshow-image"
            />
          </div>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search for medicines..."
              value={searchTerm}
              onChange={handleSearchInputChange}
            />
            <button className="search-button">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </section>

        <section className="products">
          <h2>Popular Products</h2>
          <div className="product-list">
            {filteredMedicines.map((medicine) => (
              <Card
                key={medicine._id}
                medicine={medicine}
                handleAddToCart={handleAddToCart}
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
