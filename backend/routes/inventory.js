// routes/inventory.js
const express = require("express");
const router = express.Router();
const { updateStock, getLowStock } = require("../controllers/inventoryController");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

router.get("/low-stock", auth, isAdmin, getLowStock);
router.post("/update-stock", auth, isAdmin, updateStock);

module.exports = router;
