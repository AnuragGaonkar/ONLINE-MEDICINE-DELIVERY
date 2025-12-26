// index.js (only showing relevant parts)
const connectToMongo = require("./db");
const express = require("express");
require("dotenv").config();
const cors = require("cors");

connectToMongo();

const app = express();
const port = process.env.PORT || 5001;

const allowedOrigins = [
  "http://localhost:3000",
  "https://mediquick-pqv7.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


// Stripe raw body first
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/paymentController").handleStripeWebhook
);

// JSON parser for the rest
app.use(express.json());

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/medicines", require("./routes/medicines"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/chat", require("./routes/chat")); // <-- updated file
app.use("/api/orders", require("./routes/orders"));
app.use("/api/combined-medicines", require("./routes/combinedMedicines"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
