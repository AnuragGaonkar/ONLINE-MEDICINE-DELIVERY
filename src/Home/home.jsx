import React, { useState, useEffect, useContext, useRef } from "react";
import "./home.css";
import { CartContext } from "../Cart/CartContext";
import Card from "../card/Card";
import one from "./comp_india_covered.jpg";
import two from "./comp_cod.jpg";
import three from "./safe.jpg";
import four from "./del.png";
import { useNavigate, useLocation } from "react-router-dom";

// Deployed backend base URL
const HOST = "https://mediquick-backend-yizx.onrender.com";

const Home = () => {
  const location = useLocation();
  const { addToCart } = useContext(CartContext);
  const [alertMessage, setAlertMessage] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const [quantity] = useState({});
  const searchWrapperRef = useRef(null);

  const getMedicines = async () => {
    const URL = `${HOST}/api/medicines`;
    try {
      const response = await fetch(URL);
      if (!response.ok) {
        console.log("Could not fetch medicines");
      }
      const medicines = await response.json();
      setMedicines(medicines);
    } catch (error) {
      console.log("Internal Server error.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    getMedicines();
  }, []);

  const handleAddToCart = (medicine) => {
    const isLoggedIn = !!localStorage.getItem("auth-token");
    const qty = quantity[medicine._id] || 1;

    if (!isLoggedIn) {
      window.history.replaceState(
        {
          ...(window.history.state || {}),
          usr: {
            from: location.pathname,
            productToAdd: { medicineId: medicine._id, qty },
          },
        },
        ""
      );
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }

    addToCart(medicine._id, qty);
    setAlertMessage(
      `${medicine.name} (Quantity: ${qty}) has been added to your cart!`
    );
    setTimeout(() => setAlertMessage(""), 3000);
  };

  const handleSearchInputChange = (e) => {
    const userData = e.target.value;
    setSearchTerm(userData);

    if (userData) {
      const filtered = medicines.filter((medicine) =>
        medicine.name.toLowerCase().startsWith(userData.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();

    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    const exact = medicines.find(
      (m) => m.name.toLowerCase() === term
    );

    if (exact) {
      setShowSuggestions(false);
      setSearchTerm("");
      navigate(`/medicine/${exact._id}`);
      return;
    }

    if (filteredSuggestions.length > 0) {
      const top = filteredSuggestions[0];
      setShowSuggestions(false);
      setSearchTerm("");
      navigate(`/medicine/${top._id}`);
      return;
    }

    navigate(`/search-not-found?query=${encodeURIComponent(searchTerm)}`);
  };

  const selectSuggestion = (medicineId) => {
    setSearchTerm("");
    setShowSuggestions(false);
    navigate(`/medicine/${medicineId}`);
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

          <div className="search-container" ref={searchWrapperRef}>
            <form onSubmit={handleSearchSubmit} style={{ width: "100%" }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search for medicines..."
                value={searchTerm}
                onChange={handleSearchInputChange}
                onFocus={() => setShowSuggestions(true)}
              />
              <button type="submit" className="search-button">
                <i className="fas fa-search"></i>
              </button>
            </form>

            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="resultBox">
                {filteredSuggestions.map((medicine) => (
                  <li
                    key={medicine._id}
                    onClick={() => selectSuggestion(medicine._id)}
                    className="suggestion-item"
                    style={{ textAlign: "left" }}
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
            {medicines.map((medicine) => (
              <div key={medicine._id} className="medicine-item">
                <Card
                  medicine={medicine}
                  handleAddToCart={handleAddToCart}
                />
              </div>
            ))}
          </div>
        </section>
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
