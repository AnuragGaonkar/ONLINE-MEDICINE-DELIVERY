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
  "http://localhost:3000",
  "https://mediquick-pqv7.onrender.com",
];

// 3. Global CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// 4. Preflight
app.options("*", cors());

// 5. Stripe webhook (raw body)
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/paymentController").handleStripeWebhook
);

// 6. JSON parser
app.use(express.json());

// 7. ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/medicines", require("./routes/medicines"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/combined-medicines", require("./routes/combinedMedicines"));
app.use("/api", require("./routes/inventory"));   

// 8. Health check
app.get("/", (req, res) => {
  res.send("MediQuick backend is running");
});

// 9. Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
