const express = require("express");
const {
  getCartItems,
  addToCart,
  updateCart,
  deleteFromCart,
} = require("../controllers/cartController");
const getUser = require("../middleware/getUser");

const router = express.Router();

// Route to get cart items using GET http://localhost:5001/api/cart
router.get("/", getUser, getCartItems);

// Route to add item to cart using POST http://localhost:5001/api/cart/add
router.post("/add", getUser, addToCart);

// Route to update cart item using PUT http://localhost:5001/api/cart/update
router.put("/update", getUser, updateCart);

// Route to delete item from cart using DELETE http://localhost:5001/api/cart/delete
router.delete("/delete", getUser, deleteFromCart);

module.exports = router;
