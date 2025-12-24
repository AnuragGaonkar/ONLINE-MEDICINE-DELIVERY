const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const getUser = (req, res, next) => {
  try {
    const token = req.header("auth-token");
    if (!token) {
      return res
        .status(401)
        .send({ message: "Authentication token missing. Please log in again." });
    }

    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res
      .status(401)
      .send({ message: "Invalid or expired token. Please log in again." });
  }
};

module.exports = getUser;
