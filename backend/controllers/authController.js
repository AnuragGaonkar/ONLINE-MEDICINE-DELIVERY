const User = require("../models/User");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Controller to create a user
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const securePass = await bcrypt.hash(req.body.password, salt);

    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: securePass,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      role: req.body.role,
    });

    const data = { user: { id: user.id } };
    const authToken = jwt.sign(data, JWT_SECRET);
    res.json({ authToken });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Controller to login a user
exports.loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid login credentials." });
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.status(400).json({ message: "Invalid login credentials." });
    }

    const data = { user: { id: user.id } };
    const authToken = jwt.sign(data, JWT_SECRET);
    res.json({ authToken });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Controller to get user details
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).send("Internal Server Error");
  }
};
