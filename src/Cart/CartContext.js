import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const HOST = "http://localhost:5001"; // Your backend host URL

  // Function to fetch cart items from the backend
  const fetchCartItems = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`${HOST}/api/cart`, {
        headers: {
          "auth-token": authToken,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart.items); // cart contains full details now (name, price, imageUrl, etc.)
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  // Fetch cart items when the component mounts
  useEffect(() => {
    fetchCartItems(); // Fetch cart items on mount
  }, []);

  // Function to add an item to the cart
  const addToCart = async (medicineId, quantity) => {
    try {
      const authToken = localStorage.getItem("authToken");
      console.log(medicineId, quantity);
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
        setCartItems(data.cart.items); // Update local cart with the latest data from the server
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  // Function to remove an item from the cart
  const removeFromCart = async (medicineId) => {
    try {
      const authToken = localStorage.getItem("authToken");
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
        setCartItems(data.cart.items); // Update local cart with the latest data from the server
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // Function to clear all items from the cart
  const clearCart = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`${HOST}/api/cart/clear`, {
        method: "DELETE",
        headers: {
          "auth-token": authToken,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setCartItems([]); // Clear cart locally once all items are removed from the backend
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
        removeFromCart,
        clearCart,
        fetchCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
