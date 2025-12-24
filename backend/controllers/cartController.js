// controllers/cartController.js
const User = require("../models/User");
const Medicine = require("../models/Medicine");

// GET: get cart items
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ cart: user.cart });
  } catch (error) {
    console.error("Error fetching cart items:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

// POST: add item to cart
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
      // already in cart -> increase quantity
      user.cart.items[itemIndex].quantity += quantity;
    } else {
      // new item
      user.cart.items.push({
        medicineId,
        name: medicine.name,
        price: medicine.price,
        imageUrl: medicine.imageUrl,
        prescriptionRequired: medicine.prescriptionRequired,
        quantity,
      });
    }

    // update total
    user.cart.totalAmount += medicine.price * quantity;

    await user.save();
    return res.json({ message: "Item added to cart", cart: user.cart });
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

// PUT: update cart item quantity
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

    const previousQuantity = user.cart.items[itemIndex].quantity;
    user.cart.totalAmount += (quantity - previousQuantity) * medicine.price;

    user.cart.items[itemIndex].quantity = quantity;

    await user.save();
    return res.json({ message: "Cart updated", cart: user.cart });
  } catch (error) {
    console.error("Error updating cart:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

// DELETE: remove single item from cart
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

    user.cart.totalAmount -=
      medicine.price * user.cart.items[itemIndex].quantity;

    user.cart.items.splice(itemIndex, 1);

    await user.save();
    return res.json({ message: "Item removed from cart", cart: user.cart });
  } catch (error) {
    console.error("Error deleting item from cart:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

// DELETE: clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.cart.items = [];
    user.cart.totalAmount = 0;

    await user.save();
    return res.json({ message: "Cart cleared successfully", cart: user.cart });
  } catch (error) {
    console.error("Error clearing cart:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};
