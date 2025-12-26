// CartContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Deployed Node backend URL
  const HOST = "https://mediquick-backend-yizx.onrender.com";

  const fetchCartItems = async () => {
    try {
      const authToken = localStorage.getItem("auth-token");
      if (!authToken) return;

      const response = await fetch(`${HOST}/api/cart`, {
        headers: {
          "auth-token": authToken,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart.items);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const addToCart = async (medicineId, quantity) => {
    try {
      const authToken = localStorage.getItem("auth-token");
      if (!authToken) {
        console.error("Invalid or expired token. Please log in again.");
        return;
      }

      const response = await fetch(`${HOST}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken,
        },
        body: JSON.stringify({ medicineId, quantity }),
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart.items);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const updateCart = async (medicineId, quantity) => {
    try {
      if (quantity <= 0) {
        return removeFromCart(medicineId);
      }

      const authToken = localStorage.getItem("auth-token");
      if (!authToken) return;

      const response = await fetch(`${HOST}/api/cart/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken,
        },
        body: JSON.stringify({ medicineId, quantity }),
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart.items);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  const removeFromCart = async (medicineId) => {
    try {
      const authToken = localStorage.getItem("auth-token");
      if (!authToken) return;

      const response = await fetch(`${HOST}/api/cart/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken,
        },
        body: JSON.stringify({ medicineId }),
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart.items);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const clearCart = async () => {
    try {
      const authToken = localStorage.getItem("auth-token");
      if (!authToken) return;

      const response = await fetch(`${HOST}/api/cart/clear`, {
        method: "DELETE",
        headers: {
          "auth-token": authToken,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems([]);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error clearing the cart:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateCart,
        removeFromCart,
        clearCart,
        fetchCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
