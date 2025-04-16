// server/routes/appointmentRoutes.js
const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const Doctor = require("../models/Doctor");
const { protect, isDoctor } = require("../middleware/authMiddleware");

// --- Helper Functions (Keep existing ones like timeToMinutes, hasConflict) ---
const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(":")) return NaN;
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  )
    return NaN;
  return hours * 60 + minutes;
};

const hasConflict = (
  newApptStartTime,
  newApptEndTime,
  existingAppointments
) => {
  const newStartMinutes = timeToMinutes(newApptStartTime);
  const newEndMinutes = timeToMinutes(newApptEndTime);
  if (isNaN(newStartMinutes) || isNaN(newEndMinutes)) return true; // Treat invalid as conflict

  for (const existing of existingAppointments) {
    const existingStartMinutes = timeToMinutes(existing.startTime);
    const existingEndMinutes = timeToMinutes(existing.endTime);
    if (isNaN(existingStartMinutes) || isNaN(existingEndMinutes)) continue;
    if (
      newStartMinutes < existingEndMinutes &&
      newEndMinutes > existingStartMinutes
    ) {
      return true; // Conflict found
    }
  }
  return false; // No conflicts
};
// ---

// --- PATIENT ROUTES ---
// GET MY Appointments (for the logged-in PATIENT) - Stays the same
router.get("/my-appointments", protect, async (req, res) => {
  console.log(`--- HIT: GET /my-appointments ---`);
  if (!req.user || !req.user.id) {
    console.error(
      "Error in /my-appointments: req.user or req.user.id is missing!"
    );
    return res
      .status(401)
      .json({ message: "User not properly authenticated." });
  }
  if (req.user.role !== "patient") {
    console.log(`Access Denied: User role is ${req.user.role}`);
    return res.status(403).json({ message: "Access denied. Patients only." });
  }
  console.log(`Workspaceing appointments for patientUserId: ${req.user.id}`);
  try {
    const appointments = await Appointment.find({ patientUserId: req.user.id })
      .populate("doctorId", "name specialization")
      .sort({ appointmentDate: -1, startTime: -1 });
    console.log(
      `Found ${appointments.length} appointments for patient ${req.user.id}`
    );
    res.json(appointments);
  } catch (err) {
    console.error(
      `Error fetching patient appointments for ${req.user.id}:`,
      err
    );
    res.status(500).json({ message: err.message });
  }
});

// CREATE a new appointment (by a logged-in PATIENT) - Stays the same
router.post("/", protect, async (req, res) => {
  if (req.user.role !== "patient") {
    return res
      .status(403)
      .json({ message: "Only patients can book appointments." });
  }
  const { doctorId, appointmentDate, startTime, reason, patientPhone } =
    req.body;
  if (!doctorId || !appointmentDate || !startTime || !reason) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found." });

    const appointmentDuration = doctor.appointmentDuration || 60;
    const startMinutes = timeToMinutes(startTime);
    if (isNaN(startMinutes))
      return res.status(400).json({ message: "Invalid start time format." });

    const endMinutes = startMinutes + appointmentDuration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(
      2,
      "0"
    )}:${String(endMinutes % 60).padStart(2, "0")}`;

    const requestedDate = new Date(appointmentDate);
    const reqDateOnly = new Date(
      Date.UTC(
        requestedDate.getUTCFullYear(),
        requestedDate.getUTCMonth(),
        requestedDate.getUTCDate()
      )
    );
    const startOfDay = new Date(reqDateOnly);
    const endOfDay = new Date(reqDateOnly);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const existingAppointments = await Appointment.find({
      doctorId: doctorId,
      status: { $in: ["scheduled"] },
      appointmentDate: { $gte: startOfDay, $lt: endOfDay },
    }).select("startTime endTime");

    if (hasConflict(startTime, endTime, existingAppointments)) {
      return res
        .status(400)
        .json({
          message: `Time conflict: Dr. ${doctor.name} is not available.`,
        });
    }

    const appointment = new Appointment({
      patientUserId: req.user.id,
      patientName: req.user.name,
      patientPhone: patientPhone || req.user.phone || "",
      doctorId: doctorId,
      doctorUserId: doctor.userId,
      appointmentDate: reqDateOnly,
      startTime: startTime,
      endTime: endTime,
      duration: appointmentDuration,
      reason: reason,
      status: "scheduled",
    });

    const newAppointment = await appointment.save();
    const populatedAppointment = await Appointment.findById(
      newAppointment._id
    ).populate("doctorId", "name specialization");
    res.status(201).json(populatedAppointment);
  } catch (err) {
    console.error("Error creating appointment:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    res.status(500).json({ message: "Server error creating appointment." });
  }
});

// --- COMMON/SHARED ROUTES ---

// GET a specific appointment by ID - Stays the same
router.get("/:id", protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctorId", "name specialization")
      .populate("patientUserId", "name email");
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    const isPatientOwner =
      req.user.role === "patient" &&
      appointment.patientUserId._id.toString() === req.user.id;
    const isDoctorOwner =
      req.user.role === "doctor" &&
      req.user.doctorProfile &&
      appointment.doctorId._id.toString() ===
        req.user.doctorProfile._id.toString();

    if (!isPatientOwner && !isDoctorOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json(appointment);
  } catch (err) {
    console.error("Error fetching appointment by ID:", err);
    if (err.kind === "ObjectId")
      return res
        .status(404)
        .json({ message: "Appointment not found (Invalid ID)" });
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE an appointment by ID (Handles rescheduling, status/remarks by doctor, CANCELLATION by patient)
router.patch("/:id", protect, async (req, res) => {
  const { appointmentDate, startTime, reason, status, remarks } = req.body;
  const appointmentId = req.params.id;

  try {
    const appointment = await Appointment.findById(appointmentId).populate(
      "doctorId",
      "appointmentDuration name"
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const isPatientOwner =
      req.user.role === "patient" &&
      appointment.patientUserId.toString() === req.user.id;
    const isDoctorOwner =
      req.user.role === "doctor" &&
      req.user.doctorProfile &&
      appointment.doctorId._id.toString() ===
        req.user.doctorProfile._id.toString();

    if (!isPatientOwner && !isDoctorOwner) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this appointment." });
    }

    const allowedUpdates = {};
    let requiresConflictCheck = false;

    // --- Date/Time/Reason Updates (Allowed if scheduled) ---
    if (appointment.status === "scheduled") {
      if (appointmentDate) {
        try {
          const newDate = new Date(appointmentDate);
          if (isNaN(newDate.getTime())) throw new Error("Invalid date format");
          allowedUpdates.appointmentDate = new Date(
            Date.UTC(
              newDate.getUTCFullYear(),
              newDate.getUTCMonth(),
              newDate.getUTCDate()
            )
          );
          requiresConflictCheck = true;
        } catch (e) {
          return res
            .status(400)
            .json({ message: "Invalid appointment date provided." });
        }
      }
      if (startTime) {
        if (!/^\d{2}:\d{2}$/.test(startTime))
          return res
            .status(400)
            .json({ message: "Invalid start time format (HH:MM)." });
        allowedUpdates.startTime = startTime;
        requiresConflictCheck = true;
      }
      if (reason) allowedUpdates.reason = reason;
    } else if (appointmentDate || startTime || reason) {
      return res
        .status(400)
        .json({
          message: `Cannot change date, time, or reason for appointments with status '${appointment.status}'.`,
        });
    }

    // --- Status/Remarks Updates ---
    if (isDoctorOwner) {
      // Doctor can update status and remarks
      if (status) {
        if (
          !["completed", "cancelled", "scheduled", "noshow"].includes(status)
        ) {
          return res.status(400).json({ message: "Invalid status value." });
        }
        if (status === "completed") {
          const currentRemarks =
            remarks !== undefined ? remarks : appointment.remarks;
          if (!currentRemarks || currentRemarks.trim() === "") {
            return res
              .status(400)
              .json({
                message:
                  "Remarks are required to mark an appointment as completed.",
              });
          }
        }
        allowedUpdates.status = status;
        if (status !== "scheduled") requiresConflictCheck = false; // No conflict if not scheduling
      }
      if (remarks !== undefined) {
        allowedUpdates.remarks = remarks;
      }
    } else if (isPatientOwner) {
      // **MODIFIED LOGIC**: Patient can ONLY update status to 'cancelled'
      if (status && status !== "cancelled") {
        // Patient trying to set status to something else
        return res
          .status(403)
          .json({ message: "Patients can only cancel appointments." });
      }
      if (status === "cancelled") {
        if (appointment.status !== "scheduled") {
          return res
            .status(400)
            .json({ message: `Only scheduled appointments can be cancelled.` });
        }
        allowedUpdates.status = "cancelled";
        requiresConflictCheck = false; // No conflict check needed for cancellation
      }
      if (remarks !== undefined) {
        // Patient trying to update remarks
        return res
          .status(403)
          .json({ message: "Patients cannot update remarks." });
      }
    }

    // --- Check if any valid updates exist ---
    if (Object.keys(allowedUpdates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid or allowed updates provided." });
    }

    // --- Conflict Check (if date/time changed for a scheduled appointment) ---
    if (
      requiresConflictCheck &&
      (allowedUpdates.status === "scheduled" ||
        (!allowedUpdates.status && appointment.status === "scheduled"))
    ) {
      // (Conflict check logic remains the same as before)
      console.log("--- Running Conflict Check for PATCH ---");
      const checkDate =
        allowedUpdates.appointmentDate || appointment.appointmentDate;
      const checkStartTime = allowedUpdates.startTime || appointment.startTime;
      const duration = appointment.duration;
      const startMinutes = timeToMinutes(checkStartTime);
      if (isNaN(startMinutes))
        return res
          .status(400)
          .json({ message: "Invalid start time for conflict check." });

      const endMinutes = startMinutes + duration;
      const checkEndTime = `${String(Math.floor(endMinutes / 60)).padStart(
        2,
        "0"
      )}:${String(endMinutes % 60).padStart(2, "0")}`;

      const checkDateOnly = new Date(checkDate);
      const startOfDay = new Date(
        Date.UTC(
          checkDateOnly.getUTCFullYear(),
          checkDateOnly.getUTCMonth(),
          checkDateOnly.getUTCDate()
        )
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      const existingAppointments = await Appointment.find({
        _id: { $ne: appointment._id },
        doctorId: appointment.doctorId._id,
        status: "scheduled",
        appointmentDate: { $gte: startOfDay, $lt: endOfDay },
      }).select("startTime endTime");

      if (hasConflict(checkStartTime, checkEndTime, existingAppointments)) {
        console.log("!!! Conflict Detected during PATCH !!!");
        return res
          .status(400)
          .json({
            message: `Time conflict: Dr. ${appointment.doctorId.name} is not available at the new requested time.`,
          });
      }
      console.log("--- No Conflict Found for PATCH ---");
      if (allowedUpdates.startTime) {
        allowedUpdates.endTime = checkEndTime; // Update endTime if startTime changed
      }
    }

    // Apply allowed updates
    Object.assign(appointment, allowedUpdates);
    const updatedAppointment = await appointment.save();

    const populatedAppointment = await Appointment.findById(
      updatedAppointment._id
    )
      .populate("doctorId", "name specialization")
      .populate("patientUserId", "name email");

    res.json(populatedAppointment);
  } catch (err) {
    console.error("Error updating appointment:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    if (err.kind === "ObjectId")
      return res
        .status(404)
        .json({ message: "Appointment not found (Invalid ID)" });
    res.status(500).json({ message: "Server error updating appointment." });
  }
});

// DELETE appointment - Still recommend using PATCH to cancel instead
router.delete("/:id", protect, async (req, res) => {
  return res
    .status(405)
    .json({ message: "Deletion not allowed. Cancel instead." });
});

module.exports = router;
