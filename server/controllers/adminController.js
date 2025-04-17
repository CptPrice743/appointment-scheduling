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
    return res.status(400).json({
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
// --- NEW Doctor Management Functions ---

// @desc    Get all doctors
// @route   GET /api/admin/doctors
// @access  Private/Admin
exports.getAllDoctors = async (req, res) => {
  try {
    // Populate the associated user details, excluding the user's password
    const doctors = await Doctor.find({}).populate("userId", "-password");
    res.json(doctors);
  } catch (err) {
    console.error("Error fetching all doctors:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/admin/doctors/:doctorId
// @access  Private/Admin
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId).populate(
      "userId",
      "-password"
    );
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor);
  } catch (err) {
    console.error(`Error fetching doctor ${req.params.doctorId}:`, err);
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Doctor not found (Invalid ID format)" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Add a new doctor profile and link to an existing user
// @route   POST /api/admin/doctors
// @access  Private/Admin
exports.addDoctor = async (req, res) => {
  const { userId, name, specialization, appointmentDuration } = req.body;
  // Add other fields from Doctor model as needed (e.g., availability)

  if (!userId || !name || !specialization || !appointmentDuration) {
    return res
      .status(400)
      .json({
        message:
          "Please provide userId, name, specialization, and appointmentDuration.",
      });
  }

  try {
    // 1. Check if the user exists and is suitable
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: `User with ID ${userId} not found.` });
    }
    if (user.role === "doctor" && user.doctorProfile) {
      return res
        .status(400)
        .json({
          message: `User ${user.email} is already linked to a doctor profile.`,
        });
    }
    if (user.role === "admin") {
      // Optional: Decide if admin can also be a doctor. If not:
      // return res.status(400).json({ message: 'Admin users cannot be assigned a doctor profile.' });
    }

    // 2. Check if a doctor profile already exists for this user ID (should be caught by unique index, but good practice)
    const existingDoctor = await Doctor.findOne({ userId: userId });
    if (existingDoctor) {
      return res
        .status(400)
        .json({
          message: `A doctor profile already exists for user ID ${userId}.`,
        });
    }

    // 3. Create the new Doctor record
    const newDoctor = new Doctor({
      userId,
      name, // Often this should match user.name, maybe sync later?
      specialization,
      appointmentDuration,
      // Add default availability if needed
      // standardAvailability: [...],
    });
    const savedDoctor = await newDoctor.save();

    // 4. Update the User record
    user.role = "doctor";
    user.doctorProfile = savedDoctor._id;
    await user.save();

    // Populate the user details for the response
    await savedDoctor.populate("userId", "-password");

    res
      .status(201)
      .json({
        message: "Doctor profile created and linked successfully.",
        doctor: savedDoctor,
      });
  } catch (err) {
    console.error("Error adding doctor:", err);
    if (err.code === 11000) {
      // Duplicate key error (likely on userId unique index)
      return res
        .status(400)
        .json({
          message: `Database error: A doctor profile might already be linked to user ID ${userId}.`,
        });
    }
    res.status(500).json({ message: "Server Error during doctor creation." });
  }
};

// @desc    Update doctor details
// @route   PUT /api/admin/doctors/:doctorId
// @access  Private/Admin
exports.updateDoctor = async (req, res) => {
  const { doctorId } = req.params;
  const {
    name,
    specialization,
    appointmentDuration,
    standardAvailability,
    availabilityOverrides,
  } = req.body;

  // Basic validation: Ensure at least one field is being updated
  if (
    !name &&
    !specialization &&
    typeof appointmentDuration === "undefined" &&
    !standardAvailability &&
    !availabilityOverrides
  ) {
    return res.status(400).json({ message: "No update data provided." });
  }

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update fields if provided in the request body
    if (name) doctor.name = name;
    if (specialization) doctor.specialization = specialization;
    if (typeof appointmentDuration !== "undefined")
      doctor.appointmentDuration = appointmentDuration;
    if (standardAvailability)
      doctor.standardAvailability = standardAvailability; // Add validation if needed
    if (availabilityOverrides)
      doctor.availabilityOverrides = availabilityOverrides; // Add validation if needed

    const updatedDoctor = await doctor.save();
    await updatedDoctor.populate("userId", "-password"); // Populate for response

    res.json({
      message: "Doctor details updated successfully.",
      doctor: updatedDoctor,
    });
  } catch (err) {
    console.error(`Error updating doctor ${doctorId}:`, err);
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Doctor not found (Invalid ID format)" });
    }
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.errors });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete doctor profile, cancel appointments, and update user role
// @route   DELETE /api/admin/doctors/:doctorId
// @access  Private/Admin
exports.deleteDoctor = async (req, res) => {
  const { doctorId } = req.params;

  try {
    // 1. Find the doctor profile
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }
    const associatedUserId = doctor.userId; // Store user ID before deleting doctor doc

    // 2. Find and update associated future appointments to 'cancelled'
    const updateResult = await Appointment.updateMany(
      {
        doctorId: doctorId,
        appointmentDate: { $gte: new Date() },
        status: "scheduled",
      }, // Only cancel future, scheduled ones
      { $set: { status: "cancelled" } } // Use the status from your enum [cite: 6]
    );
    console.log(
      `Cancelled ${updateResult.modifiedCount} future appointments for doctor ${doctorId}.`
    );

    // 3. Delete the Doctor record
    await Doctor.findByIdAndDelete(doctorId);

    // 4. Find and update the associated User record
    const user = await User.findById(associatedUserId);
    if (user) {
      user.role = "patient"; // Revert role
      user.doctorProfile = null; // Remove link
      await user.save();
      console.log(
        `Updated user ${user.email} (ID: ${associatedUserId}) role to patient and removed doctor profile link.`
      );
    } else {
      console.warn(
        `Could not find user with ID ${associatedUserId} to update after deleting doctor profile ${doctorId}.`
      );
    }

    res.json({
      message:
        "Doctor profile deleted, future appointments cancelled, and user role updated successfully.",
    });
  } catch (err) {
    console.error(`Error deleting doctor ${doctorId}:`, err);
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Doctor not found (Invalid ID format)" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};
