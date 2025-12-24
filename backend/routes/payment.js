// routes/payment.js
const express = require("express");
const router = express.Router();

const {
  paymentCheckout,
  handleStripeWebhook,
} = require("../controllers/paymentController");

const getUser = require("../middleware/getUser");

// Frontend calls this to start Stripe Checkout
// MUST be authenticated so req.user.id exists
router.post("/create-checkout-session", getUser, paymentCheckout);

// Stripe calls this after payment
router.post("/webhook", handleStripeWebhook);

module.exports = router;
