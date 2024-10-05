const express = require("express");
const { body } = require("express-validator");
const {
  createUser,
  loginUser,
  getUserDetails,
} = require("../controllers/authController");
const getUser = require("../middleware/getUser");
const router = express.Router();

// ROUTE-1: Create a user
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name.").isLength({ min: 3 }),
    body("email", "Enter a valid email.").isEmail(),
    body("password", "The password must be at least 8 characters.").isLength({
      min: 8,
    }),
    body("contactNumber", "Enter a valid contact number.").isLength({
      min: 10,
    }),
    body("address.street", "Street address is required.").notEmpty(),
    body("address.city", "City is required.").notEmpty(),
    body("address.postalCode", "Postal code is required.").notEmpty(),
    body("address.country", "Country is required.").notEmpty(),
    body("role", "Role must be either 'user' or 'admin'.").isIn([
      "user",
      "admin",
    ]),
  ],
  createUser
);

// ROUTE-2: Login a user
router.post(
  "/login",
  [
    body("email", "Enter a valid email.").isEmail(),
    body("password", "Password cannot be empty.").exists(),
  ],
  loginUser
);

// ROUTE-3: Get user details
router.get("/getuser", getUser, getUserDetails);

module.exports = router;
