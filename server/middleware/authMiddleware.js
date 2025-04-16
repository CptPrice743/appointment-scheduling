const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SECRET_KEY = "your-insecure-secret-key";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Auth Middleware: No token provided or invalid format");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // Fetch user and populate doctorProfile if it exists
    req.user = await User.findById(decoded.id)
      .select("-password")
      .populate("doctorProfile"); // Populate doctorProfile

    if (!req.user) {
      console.log(`Auth Middleware: User not found for ID: ${decoded.id}`);
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }
    // console.log('Auth Middleware: User authenticated:', req.user.email, 'Role:', req.user.role);
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    // Handle specific JWT errors if needed
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Not authorized, token invalid" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Not authorized, token expired" });
    }
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Middleware to check if the user is a doctor
const isDoctor = (req, res, next) => {
  if (req.user && req.user.role === "doctor") {
    next();
  } else {
    console.log(
      "Authorization Middleware: Access denied. User is not a doctor."
    );
    res.status(403).json({ message: "Access denied. Doctor role required." });
  }
};

module.exports = { protect, isDoctor };
