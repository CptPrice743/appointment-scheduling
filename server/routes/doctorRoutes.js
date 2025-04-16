const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Appointment = require("../models/appointment"); // To fetch appointments
const { protect, isDoctor } = require("../middleware/authMiddleware");

// --- Doctor Profile ---

// GET My Doctor Profile (for the logged-in doctor)
router.get("/profile/me", protect, isDoctor, async (req, res) => {
  try {
    // The user object should have doctorProfile populated from 'protect' middleware
    if (!req.user.doctorProfile) {
      return res
        .status(404)
        .json({ message: "Doctor profile not found for this user." });
    }
    res.json(req.user.doctorProfile);
  } catch (err) {
    console.error("Error fetching doctor profile:", err);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

// UPDATE My Doctor Profile (e.g., specialization, default duration)
router.patch("/profile/me", protect, isDoctor, async (req, res) => {
  const { specialization, appointmentDuration } = req.body;
  const updates = {};
  if (specialization) updates.specialization = specialization;
  if (appointmentDuration) {
    const durationNum = parseInt(appointmentDuration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ message: "Invalid appointment duration." });
    }
    updates.appointmentDuration = durationNum;
  }

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "No valid fields provided for update." });
  }

  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.user.doctorProfile._id, // Get ID from populated profile
      { $set: updates },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }
    res.json(doctor);
  } catch (err) {
    console.error("Error updating doctor profile:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error updating profile" });
  }
});

// --- Doctor Availability ---

// GET My Standard Availability
router.get("/availability/standard", protect, isDoctor, async (req, res) => {
  try {
    if (!req.user.doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }
    // Assuming doctor profile is populated in req.user via auth middleware
    const doctor = await Doctor.findById(req.user.doctorProfile._id).select(
      "standardAvailability"
    );
    if (!doctor) {
      return res
        .status(404)
        .json({ message: "Doctor availability not found." });
    }
    res.json(doctor.standardAvailability || []);
  } catch (err) {
    console.error("Error fetching standard availability:", err);
    res.status(500).json({ message: "Server error fetching availability" });
  }
});

// REPLACE/SET Standard Availability (replaces the entire array)
router.put("/availability/standard", protect, isDoctor, async (req, res) => {
  const { availabilitySlots } = req.body; // Expecting an array of slots

  if (!Array.isArray(availabilitySlots)) {
    return res
      .status(400)
      .json({ message: "Availability slots must be an array." });
  }

  // Add basic validation for each slot if desired (format, logical times)
  // e.g., check dayOfWeek, startTime format HH:MM, endTime format HH:MM, startTime < endTime

  try {
    if (!req.user.doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const doctor = await Doctor.findById(req.user.doctorProfile._id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    doctor.standardAvailability = availabilitySlots;
    await doctor.save();

    res.json(doctor.standardAvailability);
  } catch (err) {
    console.error("Error setting standard availability:", err);
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: `Validation Error: ${err.message}` });
    }
    res.status(500).json({ message: "Server error setting availability" });
  }
});

// --- Doctor's Appointments Schedule ---

// GET My Appointments (Appointments scheduled with the logged-in doctor)
router.get("/appointments/my-schedule", protect, isDoctor, async (req, res) => {
  try {
    if (!req.user.doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }
    const doctorId = req.user.doctorProfile._id;

    // Find appointments where the doctorId matches the logged-in doctor's profile ID
    const appointments = await Appointment.find({ doctorId: doctorId })
      .populate("patientUserId", "name email") // Populate patient details
      .sort({ appointmentDate: 1, startTime: 1 }); // Sort chronologically

    res.json(appointments);
  } catch (err) {
    console.error("Error fetching doctor's schedule:", err);
    res.status(500).json({ message: "Server error fetching schedule" });
  }
});

// --- Public Doctor Routes (Example) ---

// GET List of all Doctors (Publicly accessible or for internal use)
// Consider adding pagination later
router.get("/list", async (req, res) => {
  try {
    // Select only necessary fields for the list view
    const doctors = await Doctor.find({}).select(
      "name specialization appointmentDuration _id"
    );
    // Maybe add .populate('userId', 'email') if needed
    res.json(doctors);
  } catch (err) {
    console.error("Error fetching doctor list:", err);
    res.status(500).json({ message: "Server error fetching doctors" });
  }
});

// GET Specific Doctor's Public Profile (by ID)
router.get("/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId)
      // Select fields suitable for public view
      .select("name specialization standardAvailability appointmentDuration");
    // Do NOT populate userId here for public route

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor);
  } catch (err) {
    console.error("Error fetching public doctor profile:", err);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Doctor not found (Invalid ID)" });
    }
    res.status(500).json({ message: "Server error fetching doctor profile" });
  }
});

module.exports = router;
