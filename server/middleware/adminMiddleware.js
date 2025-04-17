// server/middleware/adminMiddleware.js
const { protect } = require("./authMiddleware"); // Import the existing protect middleware

const isAdmin = (req, res, next) => {
  // First, ensure the user is authenticated and req.user is populated
  protect(req, res, () => {
    // After protect runs successfully, check the role
    if (req.user && req.user.role === "admin") {
      console.log(`Admin access granted for user: ${req.user.email}`);
      next(); // User is admin, proceed
    } else {
      console.warn(
        `Admin access denied for user: ${
          req.user ? req.user.email : "No user found"
        }, Role: ${req.user ? req.user.role : "N/A"}`
      );
      res.status(403).json({ message: "Access denied. Admin role required." });
    }
  });
};

module.exports = { isAdmin };
