// server/routes/adminRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware"); // Import the new admin middleware
const {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  updateUserRole,
} = require("../controllers/adminController"); // Import controller functions

const router = express.Router();

// All routes in this file will first check for login (protect) and then for admin role (isAdmin)
router.use(protect, isAdmin); // Apply middleware to all routes in this file

// User Management Routes
router.get("/users", getAllUsers); // GET /api/admin/users
router.put("/users/:userId/status", updateUserStatus); // PUT /api/admin/users/:userId/status
router.delete("/users/:userId", deleteUser); // DELETE /api/admin/users/:userId
router.put("/users/:userId/role", updateUserRole); // PUT /api/admin/users/:userId/role

// Add Doctor Management routes here later (Step 3)
// router.post('/doctors', ...)
// router.put('/doctors/:doctorId', ...)
// router.delete('/doctors/:doctorId', ...)

// Add Appointment Oversight routes here later (Step 4)
// router.get('/appointments/all', ...)
// router.put('/appointments/admin/:appointmentId', ...)
// router.delete('/appointments/admin/:appointmentId', ...)

module.exports = router;
