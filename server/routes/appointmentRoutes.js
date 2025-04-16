const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment"); // Corrected model name import
const { protect } = require("../middleware/authMiddleware");

// Get all appointments - modified to filter by userId if authenticated
router.get("/", protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id }).sort({
      appointmentDate: -1,
      appointmentTime: -1,
    }); // Sort by date/time
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new appointment with time conflict validation - protected
router.post("/", protect, async (req, res) => {
  const appointmentData = {
    ...req.body,
    userId: req.user.id,
    remarks: req.body.remarks || "", // Ensure remarks field exists
  };

  // Prevent setting status to 'completed' without remarks on creation
  if (
    appointmentData.status === "completed" &&
    (!appointmentData.remarks || appointmentData.remarks.trim() === "")
  ) {
    return res
      .status(400)
      .json({ message: "Remarks are required to complete an appointment." });
  }

  const appointment = new Appointment(appointmentData);

  try {
    const reqDate = new Date(req.body.appointmentDate);
    const [hours, minutes] = req.body.appointmentTime.split(":").map(Number);
    const requestedDoctor = req.body.doctorName;

    reqDate.setHours(hours, minutes, 0, 0);

    const conflictingAppointments = await Appointment.find({
      status: "scheduled",
      doctorName: requestedDoctor,
      appointmentDate: {
        $gte: new Date(reqDate).setHours(0, 0, 0, 0),
        $lt: new Date(reqDate).setHours(23, 59, 59, 999),
      },
    });

    for (const existingAppt of conflictingAppointments) {
      const existingDate = new Date(existingAppt.appointmentDate);
      const [existingHours, existingMinutes] = existingAppt.appointmentTime
        .split(":")
        .map(Number);
      existingDate.setHours(existingHours, existingMinutes, 0, 0);

      const timeDiff = Math.abs(existingDate - reqDate) / (1000 * 60);

      if (timeDiff < 60) {
        return res.status(400).json({
          message: `Time conflict: Dr. ${
            requestedDoctor.split(" ")[1]
          } already has a scheduled appointment within 1 hour of this time`,
        });
      }
    }

    const newAppointment = await appointment.save();
    res.status(201).json(newAppointment);
  } catch (err) {
    if (err.name === "ValidationError") {
      // Extract validation messages for better feedback
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    res.status(400).json({ message: err.message });
  }
});

// Get appointment by ID middleware (used by GET /:id, PATCH /:id, DELETE /:id)
async function getAppointment(req, res, next) {
  let appointment;
  try {
    appointment = await Appointment.findById(req.params.id);
    if (appointment == null) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Protect endpoint: Check ownership if user is authenticated
    if (
      req.user &&
      req.user.id &&
      appointment.userId &&
      appointment.userId.toString() !== req.user.id.toString()
    ) {
      // For security, treat unauthorized access like not found in some cases,
      // or explicitly return 403 if the distinction is important.
      // Using 403 for clarity here.
      return res
        .status(403)
        .json({ message: "Not authorized to access this appointment" });
    }
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Appointment not found (Invalid ID)" });
    }
    return res.status(500).json({ message: err.message });
  }

  res.appointment = appointment;
  next();
}

// GET Single Appointment by ID (uses getAppointment middleware)
router.get("/:id", protect, getAppointment, (req, res) => {
  res.json(res.appointment);
});

// Update appointment - protected
router.patch("/:id", protect, getAppointment, async (req, res) => {
  // Ownership already checked in getAppointment middleware

  const updates = req.body;

  // --- Mandatory Remarks Validation ---
  // If the status is being updated specifically TO 'completed'
  if (updates.status && updates.status === "completed") {
    // Check if remarks are provided in the update OR if they already exist on the document
    const newRemarks =
      updates.remarks !== undefined ? updates.remarks : res.appointment.remarks;
    if (!newRemarks || newRemarks.trim() === "") {
      return res
        .status(400)
        .json({
          message: "Remarks are required to mark an appointment as completed.",
        });
    }
  }
  // --- End Mandatory Remarks Validation ---

  // Check for time conflicts ONLY if date, time, or doctor is changing AND the new status is 'scheduled'
  const isTimeOrDoctorChanging =
    updates.appointmentDate || updates.appointmentTime || updates.doctorName;
  const isScheduling =
    (updates.status || res.appointment.status) === "scheduled";

  if (isScheduling && isTimeOrDoctorChanging) {
    try {
      const appointmentDate = updates.appointmentDate
        ? new Date(updates.appointmentDate)
        : res.appointment.appointmentDate;
      const appointmentTime =
        updates.appointmentTime || res.appointment.appointmentTime;
      const doctorName = updates.doctorName || res.appointment.doctorName;

      const reqDate = new Date(appointmentDate);
      const [hours, minutes] = appointmentTime.split(":").map(Number);
      reqDate.setHours(hours, minutes, 0, 0);

      const conflictingAppointments = await Appointment.find({
        _id: { $ne: res.appointment._id }, // Exclude current appointment
        status: "scheduled",
        doctorName: doctorName,
        appointmentDate: {
          $gte: new Date(reqDate).setHours(0, 0, 0, 0),
          $lt: new Date(reqDate).setHours(23, 59, 59, 999),
        },
      });

      for (const existingAppt of conflictingAppointments) {
        const existingDate = new Date(existingAppt.appointmentDate);
        const [existingHours, existingMinutes] = existingAppt.appointmentTime
          .split(":")
          .map(Number);
        existingDate.setHours(existingHours, existingMinutes, 0, 0);
        const timeDiff = Math.abs(existingDate - reqDate) / (1000 * 60);

        if (timeDiff < 60) {
          return res.status(400).json({
            message: `Time conflict: Dr. ${
              doctorName.split(" ")[1]
            } already has a scheduled appointment within 1 hour of this time`,
          });
        }
      }
    } catch (err) {
      // Catch potential errors during date/time parsing or DB query
      return res
        .status(400)
        .json({ message: `Error validating time conflict: ${err.message}` });
    }
  }

  // Apply updates to the appointment object
  Object.keys(updates).forEach((key) => {
    // Prevent direct update of userId or _id
    if (key !== "userId" && key !== "_id") {
      res.appointment[key] = updates[key];
    }
  });

  try {
    const updatedAppointment = await res.appointment.save();
    res.json(updatedAppointment);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    res.status(400).json({ message: err.message });
  }
});

// Delete appointment - protected
router.delete("/:id", protect, getAppointment, async (req, res) => {
  // Ownership already checked in getAppointment middleware
  try {
    await res.appointment.deleteOne();
    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
