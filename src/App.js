import React from 'react';
import { CartProvider } from './Cart/CartContext';
import Home from './Home/home';
import Cart from './Cart/Cart';
import Navbar from './Navbar/Navbar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MedicineDetails from './MedicineDetails/MedicineDetails'; // Import your medicine details component

const App = () => {
  return (
    <CartProvider>
      <Router>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/medicine/:medicineId" element={<MedicineDetails />} /> 
        </Routes>
      </Router>
    </CartProvider>
  );
};

export default App;
