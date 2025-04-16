const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Ensure bcryptjs is installed
const SECRET_KEY = process.env.JWT_SECRET || "your-insecure-secret-key";

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
  if (password.length < 6) {
    // Basic password length validation
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  // --- Doctor Specific Validation ---
  // (Keep the doctor validation block from the previous version here)
  if (role === "doctor") {
    if (!specialization || !appointmentDuration) {
      return res.status(400).json({
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
    // *** MODIFIED: Case-insensitive email check ***
    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });
    if (existingUser) {
      console.log(
        `Registration attempt failed: Email ${email} (case-insensitive) already exists.`
      );
      // Use the original, more specific message here
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      // Renamed to newUser for clarity
      name,
      email,
      password: hashedPassword,
      role,
    });

    let doctorProfile = null;
    if (role === "doctor") {
      const standardAvailability = [];
      WEEKDAYS.forEach((day) => {
        standardAvailability.push({
          dayOfWeek: day,
          startTime: weekdayStartTime,
          endTime: weekdayEndTime,
        });
      });
      if (worksWeekends) {
        WEEKENDS.forEach((day) => {
          standardAvailability.push({
            dayOfWeek: day,
            startTime: weekendStartTime,
            endTime: weekendEndTime,
          });
        });
      }

      doctorProfile = new Doctor({
        userId: newUser._id, // Link before saving User is okay for ObjectId
        name: name,
        specialization: specialization,
        appointmentDuration: parseInt(appointmentDuration),
        standardAvailability: standardAvailability,
        availabilityOverrides: [],
      });
      await doctorProfile.save(); // Save doctor profile first
      newUser.doctorProfile = doctorProfile._id; // Assign the saved profile ID
      console.log(`Doctor profile created for user ${email}`);
    }

    await newUser.save(); // Save the user
    console.log(`User registered successfully: ${email}, Role: ${role}`);

    // Generate token
    const payload = { id: newUser._id, role: newUser.role };
    if (newUser.doctorProfile) {
      payload.doctorId = newUser.doctorProfile.toString();
    }
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });

    // Prepare user response (excluding password)
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      // Use the saved doctorProfile if it exists
      ...(doctorProfile && { doctorProfile: doctorProfile.toObject() }),
    };

    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    console.error("Detailed Registration Error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ message: `Validation Error: ${messages.join(", ")}` });
    }
    if (err.code === 11000) {
      // This specific message is now less likely for email if the findOne check works,
      // but good to keep for other potential unique index issues (e.g., doctor userId)
      return res
        .status(400)
        .json({
          message: `Duplicate key error: ${Object.keys(err.keyValue).join(
            ", "
          )} already exists.`,
        });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login User (Patient or Doctor) - Keep the updated version from the previous step
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    // Fetch user WITH password field for comparison
    const user = await User.findOne({ email })
      .select("+password")
      .populate("doctorProfile");

    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);

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
      ...(user.doctorProfile && {
        doctorProfile: user.doctorProfile.toObject
          ? user.doctorProfile.toObject()
          : user.doctorProfile,
      }),
    };

    res.json({ token, user: userResponse });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
