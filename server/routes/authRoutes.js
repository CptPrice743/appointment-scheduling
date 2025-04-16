// File Path: doctor-appointment-scheduling/server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Doctor = require("../models/Doctor"); // Import Doctor model
const jwt = require("jsonwebtoken");
// const bcrypt = require('bcryptjs'); // Use bcrypt in a real app
const SECRET_KEY = process.env.JWT_SECRET || "your-insecure-secret-key"; // Use env var

const timeRegex = /^\d{2}:\d{2}$/;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKENDS = ["Saturday", "Sunday"];

// Register User (Patient or Doctor)
router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    // Doctor specific fields
    specialization,
    appointmentDuration,
    // New simplified availability fields for doctors
    weekdayStartTime,
    weekdayEndTime,
    worksWeekends,
    weekendStartTime,
    weekendEndTime,
  } = req.body;

  // --- Basic Validation ---
  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Please provide name, email, password, and role" });
  }
  if (!["patient", "doctor"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified" });
  }

  // --- Doctor Specific Validation ---
  if (role === "doctor") {
    if (!specialization || !appointmentDuration) {
      return res
        .status(400)
        .json({
          message:
            "Doctors must provide specialization and default appointment duration.",
        });
    }
    if (
      isNaN(parseInt(appointmentDuration)) ||
      parseInt(appointmentDuration) <= 0
    ) {
      return res.status(400).json({ message: "Invalid appointment duration." });
    }
    if (!weekdayStartTime || !timeRegex.test(weekdayStartTime)) {
      return res
        .status(400)
        .json({ message: "Invalid weekday start time format (HH:MM)." });
    }
    if (!weekdayEndTime || !timeRegex.test(weekdayEndTime)) {
      return res
        .status(400)
        .json({ message: "Invalid weekday end time format (HH:MM)." });
    }
    if (weekdayStartTime >= weekdayEndTime) {
      return res
        .status(400)
        .json({ message: "Weekday end time must be after start time." });
    }
    if (worksWeekends) {
      if (!weekendStartTime || !timeRegex.test(weekendStartTime)) {
        return res
          .status(400)
          .json({ message: "Invalid weekend start time format (HH:MM)." });
      }
      if (!weekendEndTime || !timeRegex.test(weekendEndTime)) {
        return res
          .status(400)
          .json({ message: "Invalid weekend end time format (HH:MM)." });
      }
      if (weekendStartTime >= weekendEndTime) {
        return res
          .status(400)
          .json({ message: "Weekend end time must be after start time." });
      }
    }
  }
  // --- End Validation ---

  try {
    let user = await User.findOne({ email });
    if (user) {
      console.log(
        `Registration attempt failed: Email ${email} already exists.`
      );
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // HASH password in real app:
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({
      name,
      email,
      password: password, // Use hashedPassword in real app
      role,
    });

    let doctorProfile = null;
    if (role === "doctor") {
      // --- Generate Standard Availability Array ---
      const standardAvailability = [];
      // Add weekday slots
      WEEKDAYS.forEach((day) => {
        standardAvailability.push({
          dayOfWeek: day,
          startTime: weekdayStartTime,
          endTime: weekdayEndTime,
        });
      });
      // Add weekend slots if applicable
      if (worksWeekends) {
        WEEKENDS.forEach((day) => {
          standardAvailability.push({
            dayOfWeek: day,
            startTime: weekendStartTime,
            endTime: weekendEndTime,
          });
        });
      }
      // --- End Generate Standard Availability ---

      doctorProfile = new Doctor({
        userId: user._id,
        name: name,
        specialization: specialization,
        appointmentDuration: parseInt(appointmentDuration),
        standardAvailability: standardAvailability, // Save generated schedule
        availabilityOverrides: [], // Initialize overrides as empty
      });
      await doctorProfile.save();
      user.doctorProfile = doctorProfile._id; // Link user to doctor profile
      console.log(`Doctor profile created for user ${email}`);
    }

    await user.save();
    console.log(`User registered successfully: ${email}, Role: ${role}`);

    // Generate token
    const payload = { id: user._id, role: user.role };
    // Include doctorProfile ID in token if doctor
    if (user.doctorProfile) {
      payload.doctorId = user.doctorProfile.toString();
    }
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });

    // Prepare user response (excluding password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Include populated doctor profile if doctor
      ...(doctorProfile && { doctorProfile: doctorProfile.toObject() }),
    };

    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    console.error("Registration Error:", err);
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: `Validation Error: ${err.message}` });
    }
    // Handle other potential errors (e.g., duplicate key for user/doctor)
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login User (Patient or Doctor) - No changes needed here from previous versions
router.post("/login", async (req, res) => {
  // ... (keep existing login logic) ...
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email }).populate("doctorProfile"); // Populate doctor profile

    // In real app use bcrypt.compare:
    // const isMatch = user && await bcrypt.compare(password, user.password);
    const isMatch = user && user.password === password; // Replace with bcrypt compare

    if (!isMatch) {
      console.log(`Login failed: Invalid credentials for email ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const payload = { id: user._id, role: user.role };
    if (user.doctorProfile) {
      payload.doctorId = user.doctorProfile._id.toString();
    }
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });

    console.log(`User logged in successfully: ${email}, Role: ${user.role}`);

    // Prepare user object for response (exclude password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Include populated doctor profile if doctor
      ...(user.doctorProfile && {
        doctorProfile: user.doctorProfile.toObject(),
      }),
    };

    res.json({ token, user: userResponse });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
