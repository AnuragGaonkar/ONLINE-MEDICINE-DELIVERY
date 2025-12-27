// routes/inventory.js - Updated to match your existing structure
const express = require("express");
const router = express.Router();

const {
  getInventory,
  getLowStock,
  updateStock,
  getOutOfStock,
  getDashboardStats,
} = require("../controllers/inventoryController");

const auth = require("../middleware/getUser");    // your JWT middleware
const isAdmin = require("../middleware/isAdmin");

// Full inventory for admin
// GET /api/inventory/inventory?category=Analgesic&inStockOnly=true
router.get("/inventory", auth, isAdmin, getInventory);

// Low-stock list
// GET /api/inventory/low-stock?threshold=10
router.get("/inventory/low-stock", auth, isAdmin, getLowStock);

// Out of stock items
// GET /api/inventory/out-of-stock
router.get("/inventory/out-of-stock", auth, isAdmin, getOutOfStock);

// Dashboard stats
// GET /api/inventory/dashboard-stats
router.get("/inventory/dashboard-stats", auth, isAdmin, getDashboardStats);

// Update stock
// PUT /api/inventory/update-stock
router.put("/inventory/update-stock", auth, isAdmin, updateStock);

module.exports = router;
