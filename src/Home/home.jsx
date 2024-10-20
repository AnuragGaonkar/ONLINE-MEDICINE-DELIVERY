import React, { useState, useEffect, useContext } from "react";
import "./home.css";
import Chatbot from "../Chatbot/Chatbot";
import { CartContext } from "../Cart/CartContext";
import Card from "../card/Card";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import one from './comp_india_covered.jpg';
import two from './comp_cod.jpg';
import three from './safe.jpg';
import four from './del.png';

const Home = () => {
  const { addToCart } = useContext(CartContext);
  const [alertMessage, setAlertMessage] = useState("");
  const [medicines, setMedicines] = useState([]); // State to store medicines
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [filteredSuggestions, setFilteredSuggestions] = useState([]); // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false); // Toggle suggestion box
  const navigate = useNavigate(); // Navigation hook for redirection

  // Function to fetch medicines from API
  const getMedicines = async () => {
    const URL = "http://localhost:5001/api/medicines";
    try {
      const response = await fetch(URL);
      if (!response.ok) {
        console.log("Could not fetch medicines");
      }
      const medicines = await response.json();
      setMedicines(medicines); // Set medicines in state
    } catch (error) {
      console.log("Internal Server error.");
    }
  };

  // Fetch medicines on component mount
  useEffect(() => {
    getMedicines();
  }, []);

  // Handle adding to cart and show alert
  const handleAddToCart = (medicine) => {
    addToCart(medicine._id, 1);
    setAlertMessage(`${medicine.name} has been added to your cart!`);
    setTimeout(() => setAlertMessage(""), 3000);
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const userData = e.target.value;
    setSearchTerm(userData);

    if (userData) {
      // Filter suggestions based on search term
      const filtered = medicines.filter((medicine) =>
        medicine.name.toLowerCase().startsWith(userData.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select a suggestion and navigate to its details page
  const selectSuggestion = (medicineId) => {
    setSearchTerm(""); // Clear search term
    setShowSuggestions(false);
    navigate(`/medicine/${medicineId}`); // Navigate to medicine details page
  };

  return (
    <div className="main">
      <h1>Welcome to Online Medicine Delivery</h1>
      <main>
        <section className="hero">
          <div className="slideshow-container">
            <img src={one} alt="Slideshow 1" className="slideshow-image" />
            <img src={two} alt="Slideshow 2" className="slideshow-image" />
            <img src={three} alt="Slideshow 3" className="slideshow-image" />
            <img src={four} alt="Slideshow 4" className="slideshow-image" />
          </div>

          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search for medicines..."
              value={searchTerm}
              onChange={handleSearchInputChange}
              onFocus={() => setShowSuggestions(true)}
              style={{ color: "black" }} // Ensure text is black
            />
            <button className="search-button">
              <i className="fas fa-search"></i>
            </button>

            {/* Suggestion box */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="resultBox">
                {filteredSuggestions.map((medicine) => (
                  <li
                    key={medicine._id}
                    onClick={() => selectSuggestion(medicine._id)} // Redirect on suggestion click
                    className="suggestion-item"
                    style={{ color: "black", textAlign: "left" }} // Change the text color of suggestions
                  >
                    {medicine.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="products">
          <h2>Popular Products</h2>
          <div className="product-list">
            {/* Show all medicines, regardless of the search term */}
            {medicines.map((medicine) => (
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

export default Home;
