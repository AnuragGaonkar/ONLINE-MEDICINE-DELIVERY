const connectToMongo = require("./db");
const express = require("express");
require("dotenv").config();
const cors = require("cors"); // Import CORS

connectToMongo();
const app = express();
const port = 5001;

// Middleware to allow cross-origin requests
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from the frontend (React app)
  })
); 

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Available routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart")); // Add cart route
app.use("/api/medicines", require("./routes/medicines")); //Add medicine route

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
