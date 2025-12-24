// routes/combinedMedicines.js
const express = require("express");
const router = express.Router();

const combinedMedicinesController = require("../controllers/combinedMedicinesController");

// GET /api/combined-medicines/:id
// Returns merged data from `mediciness` (card) + `medicines` (chatbot)
router.get("/:id", combinedMedicinesController.getCombinedMedicineById);

module.exports = router;
