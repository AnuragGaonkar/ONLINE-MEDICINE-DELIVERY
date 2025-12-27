// routes/inventory.js
const express = require("express");
const router = express.Router();

const {
  getInventory,
  getLowStock,
  updateStock,
} = require("../controllers/inventoryController");

const auth = require("../middleware/getUser");    // your JWT middleware
const isAdmin = require("../middleware/isAdmin");

// Full inventory for admin
// GET /api/inventory
router.get("/inventory", auth, isAdmin, getInventory);

// Low‑stock list
// GET /api/inventory/low-stock?threshold=10
router.get("/inventory/low-stock", auth, isAdmin, getLowStock);

// Update stock
// PUT /api/inventory/update-stock
router.put("/inventory/update-stock", auth, isAdmin, updateStock);

module.exports = router;
