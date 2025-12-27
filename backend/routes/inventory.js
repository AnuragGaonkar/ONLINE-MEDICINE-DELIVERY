const express = require("express");
const router = express.Router();

const {
  getInventory,
  getLowStock,
  updateStock,
  getOutOfStock,
  getDashboardStats,
} = require("../controllers/inventoryController");

const auth = require("../middleware/getUser");
const isAdmin = require("../middleware/isAdmin");

// GET /api/inventory/inventory
router.get("/inventory", auth, isAdmin, getInventory);

// GET /api/inventory/inventory/low-stock?threshold=10
router.get("/inventory/low-stock", auth, isAdmin, getLowStock);

// PUT /api/inventory/inventory/update-stock
router.put("/inventory/update-stock", auth, isAdmin, updateStock);

// GET /api/inventory/inventory/out-of-stock
router.get("/inventory/out-of-stock", auth, isAdmin, getOutOfStock);

// GET /api/inventory/inventory/dashboard-stats
router.get("/inventory/dashboard-stats", auth, isAdmin, getDashboardStats);

module.exports = router;
