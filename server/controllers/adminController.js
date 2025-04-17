// server/controllers/adminController.js
const User = require("../models/User");
const Appointment = require("../models/appointment"); // Assuming model name is 'appointment.js'
const Doctor = require("../models/Doctor"); // Import Doctor model if needed for deletion checks

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users, exclude password, populate doctor profile if exists
    const users = await User.find({})
      .select("-password")
      .populate("doctorProfile");
    res.json(users);
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:userId/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body; // Expecting { "isActive": boolean }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "Invalid status value provided." });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deactivating themselves? Optional check:
    // if (user._id.toString() === req.user.id && !isActive) {
    //     return res.status(400).json({ message: 'Admin cannot deactivate their own account.' });
    // }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
      user: user.toJSON(),
    }); // Return updated user (without password)
  } catch (err) {
    console.error(`Error updating user status for ${userId}:`, err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete user and their associated appointments
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves? Optional check:
    // if (user._id.toString() === req.user.id) {
    //     return res.status(400).json({ message: 'Admin cannot delete their own account.' });
    // }

    // If the user is a doctor, handle doctor profile deletion logic if needed
    // This depends on your application's requirements (e.g., delete Doctor record too?)
    if (user.role === "doctor" && user.doctorProfile) {
      // Option 1: Just disassociate user from doctor profile (leaves Doctor record)
      // user.doctorProfile = null; await user.save();
      // Option 2: Delete the Doctor record (might be better handled in Doctor Management)
      // await Doctor.findByIdAndDelete(user.doctorProfile);
      console.log(
        `User ${userId} is a doctor. Consider Doctor record handling.`
      );
      // Potentially delete related appointments booked *with* this doctor as well?
      // await Appointment.deleteMany({ doctor: user.doctorProfile });
    }

    // Delete appointments booked BY this user
    const appointmentDeletionResult = await Appointment.deleteMany({
      user: userId,
    });
    console.log(
      `Deleted ${appointmentDeletionResult.deletedCount} appointments for user ${userId}.`
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      message: "User and associated appointments deleted successfully.",
    });
  } catch (err) {
    console.error(`Error deleting user ${userId}:`, err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:userId/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body; // Expecting { "role": "patient|doctor|admin" }

  // Validate the role against the schema enum
  const allowedRoles = User.schema.path("role").enumValues;
  if (!role || !allowedRoles.includes(role)) {
    return res
      .status(400)
      .json({
        message: `Invalid role specified. Allowed roles are: ${allowedRoles.join(
          ", "
        )}.`,
      });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: Prevent changing own role?
    // if (user._id.toString() === req.user.id && user.role !== role) {
    //     return res.status(400).json({ message: 'Admin cannot change their own role.' });
    // }

    // Handle potential logic changes when role changes
    // e.g., if changing TO 'doctor', maybe create a Doctor profile?
    // e.g., if changing FROM 'doctor', maybe disassociate/delete Doctor profile?
    if (user.role === "doctor" && role !== "doctor" && user.doctorProfile) {
      console.warn(
        `User ${userId} changing role from doctor. Consider handling Doctor profile ${user.doctorProfile}.`
      );
      // Example: Disassociate Doctor profile
      // await Doctor.findByIdAndUpdate(user.doctorProfile, { user: null }); // Or delete?
      // user.doctorProfile = null;
    }
    // Add similar logic if changing TO 'doctor'

    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role} successfully.`,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error(`Error updating user role for ${userId}:`, err);
    res.status(500).json({ message: "Server Error" });
  }
};
