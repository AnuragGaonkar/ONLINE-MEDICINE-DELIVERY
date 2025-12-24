// routes/cart.js
const express = require("express");
const {
  getCartItems,
  addToCart,
  updateCart,
  deleteFromCart,
  clearCart,
} = require("../controllers/cartController");
const getUser = require("../middleware/getUser");

const router = express.Router();

// GET http://localhost:5001/api/cart
router.get("/", getUser, getCartItems);

// POST http://localhost:5001/api/cart/add
router.post("/add", getUser, addToCart);

// PUT http://localhost:5001/api/cart/update
router.put("/update", getUser, updateCart);

// DELETE http://localhost:5001/api/cart/delete
router.delete("/delete", getUser, deleteFromCart);

// DELETE http://localhost:5001/api/cart/clear
router.delete("/clear", getUser, clearCart);

module.exports = router;
