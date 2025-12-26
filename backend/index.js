// index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToMongo = require("./db");

// 1. Connect to MongoDB
connectToMongo();

const app = express();
const port = process.env.PORT || 5001;

// 2. Allowed origins (local + deployed frontend)
const allowedOrigins = [
  "http://localhost:3000",                     // local React
  "https://mediquick-pqv7.onrender.com",      // deployed frontend
];

// 3. Global CORS middleware (MUST be before any routes)
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser / same-origin requests with no Origin header
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // only if you use cookies / auth headers
  })
);

// 4. Preflight handling for all routes (optional but helpful)
app.options("*", cors());

// 5. Stripe webhook must see the raw body BEFORE express.json
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/paymentController").handleStripeWebhook
);

// 6. JSON parser for the rest of the API
app.use(express.json());

// 7. ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/medicines", require("./routes/medicines"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/combined-medicines", require("./routes/combinedMedicines"));

// 8. Health check / root
app.get("/", (req, res) => {
  res.send("MediQuick backend is running");
});

// 9. Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
