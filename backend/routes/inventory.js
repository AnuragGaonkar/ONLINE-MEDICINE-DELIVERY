// routes/inventory.js
const express = require("express");
const router = express.Router();

const {
  getInventory,
  getLowStock,
  updateStock,
  restockMedicine,          // <<< add this
} = require("../controllers/inventoryController");

const auth = require("../middleware/getUser");
const isAdmin = require("../middleware/isAdmin");

// Full inventory for admin
router.get("/inventory", auth, isAdmin, getInventory);

// Low‑stock list
router.get("/inventory/low-stock", auth, isAdmin, getLowStock);

// Update stock (absolute set)
router.put("/inventory/update-stock", auth, isAdmin, updateStock);

// Restock (increment)
router.post("/inventory/restock", auth, isAdmin, restockMedicine);  // <<< new

module.exports = router;
