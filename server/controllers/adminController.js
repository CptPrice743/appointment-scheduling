// server/controllers/adminController.js
const mongoose = require("mongoose");
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
    return res.status(400).json({
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
      return res.status(400).json({
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
      return res.status(400).json({
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

    res.status(201).json({
      message: "Doctor profile created and linked successfully.",
      doctor: savedDoctor,
    });
  } catch (err) {
    console.error("Error adding doctor:", err);
    if (err.code === 11000) {
      // Duplicate key error (likely on userId unique index)
      return res.status(400).json({
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

// --- NEW Appointment Oversight Functions ---

// @desc    Get all appointments (with filtering) for admin
// @route   GET /api/admin/appointments/all
// @access  Private/Admin
exports.getAllAppointmentsAdmin = async (req, res) => {
  try {
    const { patientId, doctorId, dateStart, dateEnd, status } = req.query;

    const filter = {};

    // Add filters based on query params
    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      filter.patientUserId = patientId;
    }
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      filter.doctorId = doctorId;
    }
    if (
      status &&
      Appointment.schema.path("status").enumValues.includes(status)
    ) {
      // Validate against enum [cite: 6]
      filter.status = status;
    }

    // Date range filtering
    if (dateStart || dateEnd) {
      filter.appointmentDate = {};
      if (dateStart) {
        // Assume dateStart is YYYY-MM-DD, set to start of day
        filter.appointmentDate.$gte = new Date(dateStart);
      }
      if (dateEnd) {
        // Assume dateEnd is YYYY-MM-DD, set to end of day
        const endDate = new Date(dateEnd);
        endDate.setHours(23, 59, 59, 999); // Include the whole end day
        filter.appointmentDate.$lte = endDate;
      }
    }

    console.log("Admin Appointment Filter:", filter); // Log the filter being used

    const appointments = await Appointment.find(filter)
      .populate("patientUserId", "name email") // Populate patient details [cite: 7]
      .populate({
        // Populate doctor details via doctorId (ref: 'Doctor') [cite: 6, 5]
        path: "doctorId",
        select: "name specialization userId", // Select fields from Doctor model [cite: 5]
        populate: {
          // Optionally populate the user linked to the doctor
          path: "userId",
          select: "name email", // Select fields from User model [cite: 7]
        },
      })
      .sort({ appointmentDate: -1, startTime: 1 }); // Sort by date descending, then time ascending

    res.json(appointments);
  } catch (err) {
    console.error("Error fetching all appointments for admin:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update any appointment by ID (Admin)
// @route   PUT /api/admin/appointments/:appointmentId
// @access  Private/Admin
exports.updateAppointmentAdmin = async (req, res) => {
  const { appointmentId } = req.params;
  // Extract fields that admin might update
  const {
    appointmentDate,
    startTime,
    endTime,
    duration,
    status,
    reason,
    remarks,
    patientPhone,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    return res.status(400).json({ message: "Invalid Appointment ID format." });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Update fields if provided in the request body
    // Add validation as needed (e.g., check status enum, time format)
    if (appointmentDate)
      appointment.appointmentDate = new Date(appointmentDate);
    if (startTime) appointment.startTime = startTime; // Add HH:MM validation if needed
    if (endTime) appointment.endTime = endTime; // Add HH:MM validation if needed
    if (duration) appointment.duration = duration;
    if (
      status &&
      Appointment.schema.path("status").enumValues.includes(status)
    ) {
      // Validate status [cite: 6]
      appointment.status = status;
    } else if (status) {
      return res.status(400).json({
        message: `Invalid status value. Allowed: ${Appointment.schema
          .path("status")
          .enumValues.join(", ")}`,
      });
    }
    if (reason) appointment.reason = reason;
    if (remarks) appointment.remarks = remarks;
    if (patientPhone) appointment.patientPhone = patientPhone; // [cite: 6]

    // Optional: Log admin action
    // appointment.lastUpdatedByAdmin = req.user.id; // Add this field to Appointment model if desired

    const updatedAppointment = await appointment.save();

    // Populate details for the response
    await updatedAppointment.populate("patientUserId", "name email");
    await updatedAppointment.populate({
      path: "doctorId",
      select: "name specialization userId",
      populate: { path: "userId", select: "name email" },
    });

    res.json({
      message: "Appointment updated successfully by admin.",
      appointment: updatedAppointment,
    });
  } catch (err) {
    console.error(`Error updating appointment ${appointmentId} by admin:`, err);
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.errors });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete any appointment by ID (Admin)
// @route   DELETE /api/admin/appointments/:appointmentId
// @access  Private/Admin
exports.deleteAppointmentAdmin = async (req, res) => {
  const { appointmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    return res.status(400).json({ message: "Invalid Appointment ID format." });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    await Appointment.findByIdAndDelete(appointmentId);

    res.json({
      message: `Appointment ${appointmentId} deleted successfully by admin.`,
    });
  } catch (err) {
    console.error(`Error deleting appointment ${appointmentId} by admin:`, err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the date 7 days ago for new user registrations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // --- Perform ALL database queries FIRST ---

    // 1. Total Appointments
    const totalAppointments = await Appointment.countDocuments();

    // 2. Appointments per Doctor (using Aggregation)
    const appointmentsPerDoctorData = await Appointment.aggregate([
      { $group: { _id: "$doctorId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: Doctor.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          doctorName: { $ifNull: ["$doctorDetails.name", "Unknown Doctor"] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 2.5. Appointments by Status (Aggregation)
    const appointmentsByStatus = await Appointment.aggregate([
      // Declaration is HERE
      { $group: { _id: "$status", count: { $sum: 1 } } },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);

    // 3. Upcoming Appointments Count
    const upcomingAppointments = await Appointment.countDocuments({
      status: "scheduled",
      appointmentDate: { $gte: today },
    });

    // 4. New User Registrations (e.g., in the last 7 days)
    const newUserRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // --- Log the results AFTER all queries are done ---
    console.log(
      "Backend - Appointments by Status:",
      JSON.stringify(appointmentsByStatus, null, 2)
    );
    // You can add logs for other stats here too if needed

    // --- Send the response AFTER all queries and logs ---
    res.json({
      totalAppointments,
      appointmentsPerDoctor: appointmentsPerDoctorData,
      appointmentsByStatus, // Use the variable HERE, after it's declared and populated
      upcomingAppointments,
      newUserRegistrations,
    });
  } catch (err) {
    // Log the specific error received in the catch block
    console.error("Error fetching admin dashboard stats:", err); // Log the actual error object
    // Ensure the error message clearly indicates the context
    res
      .status(500)
      .json({
        message: `Server Error fetching dashboard stats: ${err.message}`,
      });
  }
};
