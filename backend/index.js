const connectToMongo = require("./db");
const express = require("express");
require("dotenv").config();
const cors = require("cors");

connectToMongo();

const app = express();
const port = 5001;

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// ROUTES
const paymentRoutes = require("./routes/payment");
const chatRoutes = require("./routes/chat");
const ordersRoute = require("./routes/orders");

// 1) Stripe webhook: raw body
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/paymentController").handleStripeWebhook
);

// 2) For all other routes, use JSON parser
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/medicines", require("./routes/medicines"));
app.use("/api/payment", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/orders", ordersRoute);

// NEW: merged data endpoint (view + chatbot collections)
app.use(
  "/api/combined-medicines",
  require("./routes/combinedMedicines")
);

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
