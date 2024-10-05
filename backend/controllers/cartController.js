const User = require("../models/User");
const Medicine = require("../models/Medicine"); // Assuming you have a Medicine model

// Function to get cart items
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ cart: user.cart });
  } catch (error) {
    console.error("Error fetching cart items:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Function to add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineId, quantity } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found." });
    }

    const itemIndex = user.cart.items.findIndex(
      (item) => item.medicineId.toString() === medicineId
    );

    if (itemIndex >= 0) {
      // Update quantity if already in cart
      user.cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      user.cart.items.push({ medicineId, quantity });
    }

    // Update total amount
    user.cart.totalAmount += medicine.price * quantity;

    await user.save();
    res.json({ message: "Item added to cart", cart: user.cart });
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Function to update cart item
exports.updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineId, quantity } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const itemIndex = user.cart.items.findIndex(
      (item) => item.medicineId.toString() === medicineId
    );

    if (itemIndex < 0) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found." });
    }

    // Update total amount
    const previousQuantity = user.cart.items[itemIndex].quantity;
    user.cart.totalAmount += (quantity - previousQuantity) * medicine.price;

    // Update the quantity in the cart
    user.cart.items[itemIndex].quantity = quantity;

    await user.save();
    res.json({ message: "Cart updated", cart: user.cart });
  } catch (error) {
    console.error("Error updating cart:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Function to delete item from cart
exports.deleteFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicineId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const itemIndex = user.cart.items.findIndex(
      (item) => item.medicineId.toString() === medicineId
    );

    if (itemIndex < 0) {
      return res.status(404).json({ message: "Item not found in cart." });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found." });
    }

    // Update total amount
    user.cart.totalAmount -=
      medicine.price * user.cart.items[itemIndex].quantity;

    // Remove the item from the cart
    user.cart.items.splice(itemIndex, 1);

    await user.save();
    res.json({ message: "Item removed from cart", cart: user.cart });
  } catch (error) {
    console.error("Error deleting item from cart:", error.message);
    res.status(500).send("Internal Server Error");
  }
};
