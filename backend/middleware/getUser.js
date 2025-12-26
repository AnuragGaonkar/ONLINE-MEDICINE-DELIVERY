// middleware/getUser.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const getUser = (req, res, next) => {
  try {
    // Support both: "auth-token" and standard "Authorization: Bearer <token>"
    let token = req.header("auth-token");

    if (!token) {
      const authHeader = req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res
        .status(401)
        .send({
          message: "Authentication token missing. Please log in again.",
        });
    }

    const data = jwt.verify(token, JWT_SECRET);
    // matches what you set in authController: { user: { id: user.id } }
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
