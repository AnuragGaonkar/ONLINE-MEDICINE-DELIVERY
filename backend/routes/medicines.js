// routes/medicines.js
const express = require("express");
const router = express.Router();
const medicinesController = require("../controllers/medicinesController");

// Get list of medicines with filters 
router.get("/", medicinesController.getMedicines);

// Get details of a specific medicine by ID
router.get("/:id", medicinesController.getMedicineById);

module.exports = router;
