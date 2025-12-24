const express = require("express");
const router = express.Router();
const getUser = require("../middleware/getUser");
const { getMyOrders } = require("../controllers/orderController");

// ROUTE-1: Get all orders for logged in user
router.get("/my", getUser, getMyOrders);

module.exports = router;
