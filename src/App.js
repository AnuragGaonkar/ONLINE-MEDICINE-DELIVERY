import React, { useEffect } from "react";
import { CartProvider } from "./Cart/CartContext";
import Home from "./Home/home";
import Cart from "./Cart/Cart";
import Navbar from "./Navbar/Navbar";
import Chatbot from "./Chatbot/Chatbot";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MedicineDetails from "./MedicineDetails/MedicineDetails";
import About from "./About/About"; 
import PaymentSuccess from "./PaymentSuccess/PaymentSuccess";
import Profile from "./Profile/Profile";
import SearchNotFound from "./SearchNotFound.jsx";
import AdminInventory from "./AdminInventory.jsx";

const App = () => {
  // 🔥 Wake Render backend when frontend loads
  useEffect(() => {
    const endpoints = [
      "https://mediquick-backend-yizx.onrender.com",        // light root/health
      "https://mediquick-backend-yizx.onrender.com" // optional: chatbot-specific
    ];

    endpoints.forEach((url) => {
      fetch(url, { method: "GET" }).catch(() => {
        // ignore errors – this is just a warm-up ping
      });
    });
  }, []);

  return (
    <CartProvider>
      <Router>
        <Navbar />
        <div className="home-main-wrapper">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/medicine/:id" element={<MedicineDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search-not-found" element={<SearchNotFound />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
          </Routes>
        </div>
        <Chatbot />
      </Router>
    </CartProvider>
  );
};

export default App;
