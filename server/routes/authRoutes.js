const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Doctor = require("../models/Doctor"); // Import Doctor model
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your-secret-key";

// Register User (Patient or Doctor)
router.post("/register", async (req, res) => {
  const { name, email, password, role, specialization, appointmentDuration } =
    req.body;

  // Basic validation
  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Please provide name, email, password, and role" });
  }
  if (!["patient", "doctor"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified" });
  }
  if (role === "doctor" && (!specialization || !appointmentDuration)) {
    return res.status(400).json({
      message:
        "Doctors must provide specialization and default appointment duration",
    });
  }
  if (
    role === "doctor" &&
    (isNaN(parseInt(appointmentDuration)) || parseInt(appointmentDuration) <= 0)
  ) {
    return res.status(400).json({ message: "Invalid appointment duration" });
  }

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

    // Create the user
    // In a real app, HASH the password before saving:
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    // user = new User({ name, email, password: hashedPassword, role });
    user = new User({
      name,
      email,
      password /* Use hashed password here */,
      role,
    });

    let doctorProfile = null;
    if (role === "doctor") {
      // Create doctor profile if registering as a doctor
      doctorProfile = new Doctor({
        userId: user._id, // Link to the user being created
        name: name, // Store name in doctor profile too
        specialization: specialization,
        appointmentDuration: parseInt(appointmentDuration),
        standardAvailability: [], // Initialize with empty availability, doctor can set later
      });
      await doctorProfile.save();
      user.doctorProfile = doctorProfile._id; // Link user to doctor profile
      console.log(`Doctor profile created for user ${email}`);
    }

    await user.save();
    console.log(`User registered successfully: ${email}, Role: ${role}`);

    // Generate token for immediate login after registration
    const payload = {
      id: user._id,
      role: user.role,
      // Include doctorProfile ID in token if doctor
      ...(user.doctorProfile && { doctorId: user.doctorProfile.toString() }),
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });

    // Return user info (excluding password) and token
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Include populated doctor profile if doctor
      ...(doctorProfile && { doctorProfile: doctorProfile.toObject() }),
    };

    res.status(201).json({
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("Registration Error:", err);
    // Handle potential duplicate key error for doctor profile if needed
    if (err.code === 11000 && err.keyPattern && err.keyPattern.doctorProfile) {
      return res.status(400).json({ message: "Doctor profile link error." });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login User (Patient or Doctor)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    // Find user and populate doctor profile if it exists
    const user = await User.findOne({ email }).populate("doctorProfile");

    // Check user and password
    // In a real app, compare hashed password:
    // const isMatch = user && await bcrypt.compare(password, user.password);
    const isMatch = user && user.password === password; // Replace with bcrypt compare

    if (!isMatch) {
      console.log(`Login failed: Invalid credentials for email ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const payload = {
      id: user._id,
      role: user.role,
      // Include doctorProfile ID in token if doctor
      ...(user.doctorProfile && {
        doctorId: user.doctorProfile._id.toString(),
      }),
    };
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

    res.json({
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
