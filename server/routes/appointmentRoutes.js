const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const Doctor = require("../models/Doctor");
const { protect } = require("../middleware/authMiddleware"); // Only need protect here generally
const { timeToMinutes, getDayOfWeekString } = require("../utils/timeUtils"); // Import helpers

// --- Helper Functions (Keep hasConflict if still needed, but primary check is now slot availability) ---
// You might not need hasConflict anymore if you rely on the available slots endpoint logic
// const hasConflict = (newApptStartTime, newApptEndTime, existingAppointments) => { ... };
// ---

// --- PATIENT ROUTES ---

// GET MY Appointments (for the logged-in PATIENT) - Stays the same
router.get("/my-appointments", protect, async (req, res) => {
  // ... (keep existing code) ...
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
  console.log(`Fetching appointments for patientUserId: ${req.user.id}`);
  try {
    const appointments = await Appointment.find({ patientUserId: req.user.id })
      .populate("doctorId", "name specialization") // Populate doctor name/spec
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

// CREATE a new appointment (by a logged-in PATIENT) - **MODIFIED**
router.post("/", protect, async (req, res) => {
  if (req.user.role !== "patient") {
    return res
      .status(403)
      .json({ message: "Only patients can book appointments." });
  }
  const { doctorId, appointmentDate, startTime, reason, patientPhone } =
    req.body;

  if (!doctorId || !appointmentDate || !startTime || !reason) {
    return res
      .status(400)
      .json({
        message: "Missing required fields (Doctor, Date, Start Time, Reason).",
      });
  }

  // Validate Time Format
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return res
      .status(400)
      .json({ message: "Invalid start time format (HH:MM)." });
  }

  try {
    const requestedDate = new Date(appointmentDate + "T00:00:00Z"); // Parse date as UTC
    if (isNaN(requestedDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid appointment date provided." });
    }
    const reqDateOnly = new Date(
      Date.UTC(
        requestedDate.getUTCFullYear(),
        requestedDate.getUTCMonth(),
        requestedDate.getUTCDate()
      )
    );

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // --- Availability Check ---
    const dayOfWeek = getDayOfWeekString(requestedDate.getUTCDay());
    const availabilityRule = doctor.standardAvailability.find(
      (slot) => slot.dayOfWeek === dayOfWeek
    );

    if (!availabilityRule) {
      return res
        .status(400)
        .json({
          message: `Dr. ${doctor.name} is not available on ${dayOfWeek}s.`,
        });
    }

    const requestedStartMinutes = timeToMinutes(startTime);
    const availableStartMinutes = timeToMinutes(availabilityRule.startTime);
    const availableEndMinutes = timeToMinutes(availabilityRule.endTime);
    const appointmentDuration = doctor.appointmentDuration;
    const requestedEndMinutes = requestedStartMinutes + appointmentDuration;

    if (
      isNaN(requestedStartMinutes) ||
      isNaN(availableStartMinutes) ||
      isNaN(availableEndMinutes)
    ) {
      return res
        .status(400)
        .json({
          message: "Invalid time format found during availability check.",
        });
    }

    // 1. Check if requested time is within the doctor's general availability window for that day
    if (
      requestedStartMinutes < availableStartMinutes ||
      requestedEndMinutes > availableEndMinutes
    ) {
      return res
        .status(400)
        .json({
          message: `Requested time ${startTime} is outside Dr. ${doctor.name}'s available hours (${availabilityRule.startTime} - ${availabilityRule.endTime}) on ${dayOfWeek}s.`,
        });
    }

    // 2. Check if the *specific* slot is potentially valid (starts on a multiple of duration from the availability start)
    // This helps catch invalid manual entries if the frontend fails. Optional but good practice.
    if (
      (requestedStartMinutes - availableStartMinutes) % appointmentDuration !==
      0
    ) {
      console.warn(
        `Requested start time ${startTime} does not align with duration ${appointmentDuration} from availability start ${availabilityRule.startTime}`
      );
      // Decide whether to reject or just log this potential issue
      // return res.status(400).json({ message: `Requested time slot ${startTime} is not valid based on the doctor's appointment duration.` });
    }

    // 3. Check for existing appointment conflicts at that exact time or overlapping
    const startOfDay = new Date(reqDateOnly);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const existingAppointments = await Appointment.find({
      doctorId: doctorId,
      status: { $in: ["scheduled"] }, // Only check against scheduled
      appointmentDate: { $gte: startOfDay, $lt: endOfDay },
    });

    const calculatedEndTime = `${String(
      Math.floor(requestedEndMinutes / 60)
    ).padStart(2, "0")}:${String(requestedEndMinutes % 60).padStart(2, "0")}`;

    for (const existing of existingAppointments) {
      const existingStartMinutes = timeToMinutes(existing.startTime);
      const existingEndMinutes = timeToMinutes(existing.endTime);
      // Check for overlap: (NewStart < ExistingEnd) and (NewEnd > ExistingStart)
      if (
        requestedStartMinutes < existingEndMinutes &&
        requestedEndMinutes > existingStartMinutes
      ) {
        console.log(
          `Conflict found: Requested ${startTime}-${calculatedEndTime} overlaps with existing ${existing.startTime}-${existing.endTime}`
        );
        return res
          .status(400)
          .json({
            message: `Time slot ${startTime} is already booked for Dr. ${doctor.name} on this date.`,
          });
      }
    }
    // --- End Availability Check ---

    // Create Appointment
    const appointment = new Appointment({
      patientUserId: req.user.id,
      patientName: req.user.name,
      patientPhone: patientPhone || req.user.phone || "", // Get phone if available
      doctorId: doctorId,
      doctorUserId: doctor.userId, // Link doctor's user ID
      appointmentDate: reqDateOnly, // Store just the date part
      startTime: startTime,
      endTime: calculatedEndTime, // Store calculated end time
      duration: appointmentDuration,
      reason: reason,
      status: "scheduled",
    });

    const newAppointment = await appointment.save();
    // Populate necessary fields for the response
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("doctorId", "name specialization")
      .populate("patientUserId", "name email"); // Populate patient for consistency?

    res.status(201).json(populatedAppointment);
  } catch (err) {
    console.error("Error creating appointment:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Doctor not found (invalid ID)." });
    }
    res.status(500).json({ message: "Server error creating appointment." });
  }
});

// --- COMMON/SHARED ROUTES ---

// GET a specific appointment by ID - Stays the same (authorization logic handles patient/doctor access)
router.get("/:id", protect, async (req, res) => {
  // ... (keep existing code) ...
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctorId", "name specialization") // Populate doctor details
      .populate("patientUserId", "name email"); // Populate patient details

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // Authorization check: either the patient user or the doctor user must match
    const isPatientOwner =
      req.user.id === appointment.patientUserId?._id.toString();
    const isDoctorOwner = req.user.id === appointment.doctorUserId?.toString();

    if (!isPatientOwner && !isDoctorOwner) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this appointment" });
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

// UPDATE an appointment by ID (Handles rescheduling, status/remarks by doctor, CANCELLATION by patient) - **MODIFIED**
router.patch("/:id", protect, async (req, res) => {
  // ... (keep most of the existing PATCH logic, but add conflict check if date/time changes) ...
  const { appointmentDate, startTime, reason, status, remarks } = req.body;
  const appointmentId = req.params.id;

  try {
    const appointment = await Appointment.findById(appointmentId).populate(
      "doctorId",
      "appointmentDuration name"
    ); // Populate doctor for duration/name
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const isPatientOwner =
      req.user.id === appointment.patientUserId?.toString();
    const isDoctorOwner = req.user.id === appointment.doctorUserId?.toString(); // Check against doctor's USER id

    if (!isPatientOwner && !isDoctorOwner) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this appointment." });
    }

    const allowedUpdates = {};
    let requiresConflictCheck = false;
    let newStartTime = appointment.startTime;
    let newDate = appointment.appointmentDate;
    const appointmentDuration =
      appointment.doctorId?.appointmentDuration || appointment.duration; // Use doctor's default or existing

    // --- Date/Time/Reason Updates (Allowed if scheduled) ---
    if (appointment.status === "scheduled") {
      if (appointmentDate) {
        try {
          const dateObj = new Date(appointmentDate + "T00:00:00Z");
          if (isNaN(dateObj.getTime())) throw new Error("Invalid date format");
          allowedUpdates.appointmentDate = new Date(
            Date.UTC(
              dateObj.getUTCFullYear(),
              dateObj.getUTCMonth(),
              dateObj.getUTCDate()
            )
          );
          newDate = allowedUpdates.appointmentDate; // For conflict check
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
        newStartTime = startTime; // For conflict check
        requiresConflictCheck = true;
      }
      if (reason !== undefined) allowedUpdates.reason = reason; // Allow updating reason
    } else if (
      appointmentDate ||
      startTime ||
      (reason !== undefined && reason !== appointment.reason)
    ) {
      // Prevent changing date/time/reason if not scheduled (allow updating reason if it's the ONLY change)
      if (
        appointmentDate ||
        startTime ||
        reason === undefined ||
        Object.keys(req.body).length > 1
      ) {
        return res
          .status(400)
          .json({
            message: `Cannot change date, time, or reason for appointments with status '${appointment.status}'.`,
          });
      }
      if (reason !== undefined) allowedUpdates.reason = reason; // Allow ONLY reason update on non-scheduled
    }

    // --- Status/Remarks Updates ---
    if (isDoctorOwner) {
      // Only doctor can change status (except patient cancelling) and remarks
      if (status) {
        if (
          !["completed", "cancelled", "scheduled", "noshow"].includes(status)
        ) {
          return res.status(400).json({ message: "Invalid status value." });
        }
        // If moving TO scheduled, re-enable conflict check
        if (
          status === "scheduled" &&
          (allowedUpdates.appointmentDate || allowedUpdates.startTime)
        ) {
          requiresConflictCheck = true;
        }
        // If moving FROM scheduled, disable conflict check (already handled by patient cancel below)
        if (status !== "scheduled" && appointment.status === "scheduled") {
          requiresConflictCheck = false;
        }
        allowedUpdates.status = status;
      }
      if (remarks !== undefined) {
        // Allow empty remarks string
        allowedUpdates.remarks = remarks;
      }
      // Validate remarks if completing
      if (
        allowedUpdates.status === "completed" ||
        (status === "completed" && !allowedUpdates.status)
      ) {
        const finalRemarks =
          allowedUpdates.remarks !== undefined
            ? allowedUpdates.remarks
            : appointment.remarks;
        if (!finalRemarks || finalRemarks.trim() === "") {
          return res
            .status(400)
            .json({
              message:
                "Remarks are required to mark an appointment as completed.",
            });
        }
      }
    } else if (isPatientOwner) {
      // Patient can ONLY cancel
      if (status && status !== "cancelled") {
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

    // --- Conflict Check (if date/time changed and status is or becomes scheduled) ---
    const finalStatus = allowedUpdates.status || appointment.status;
    if (requiresConflictCheck && finalStatus === "scheduled") {
      console.log("--- Running Conflict Check for PATCH ---");
      const checkDate = newDate;
      const checkStartTime = newStartTime;
      const startMinutes = timeToMinutes(checkStartTime);

      if (isNaN(startMinutes) || !appointmentDuration) {
        console.error("Invalid data for conflict check:", {
          checkStartTime,
          appointmentDuration,
        });
        return res
          .status(400)
          .json({ message: "Invalid time or duration for conflict check." });
      }

      const endMinutes = startMinutes + appointmentDuration;
      const checkEndTime = `${String(Math.floor(endMinutes / 60)).padStart(
        2,
        "0"
      )}:${String(endMinutes % 60).padStart(2, "0")}`;
      allowedUpdates.endTime = checkEndTime; // Ensure endTime is updated if startTime/Date changes

      const startOfDay = new Date(
        Date.UTC(
          checkDate.getUTCFullYear(),
          checkDate.getUTCMonth(),
          checkDate.getUTCDate()
        )
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      const existingAppointments = await Appointment.find({
        _id: { $ne: appointment._id }, // Exclude self
        doctorId: appointment.doctorId._id,
        status: "scheduled",
        appointmentDate: { $gte: startOfDay, $lt: endOfDay },
      });

      for (const existing of existingAppointments) {
        const existingStartMinutes = timeToMinutes(existing.startTime);
        const existingEndMinutes = timeToMinutes(existing.endTime);
        if (
          startMinutes < existingEndMinutes &&
          endMinutes > existingStartMinutes
        ) {
          console.log("!!! Conflict Detected during PATCH !!!");
          return res
            .status(400)
            .json({
              message: `Time conflict: Dr. ${appointment.doctorId.name} is already booked at the new requested time.`,
            });
        }
      }
      console.log("--- No Conflict Found for PATCH ---");
    } else if (allowedUpdates.startTime && !requiresConflictCheck) {
      // Update endTime even if not conflict checking (e.g. patient updated reason only)
      const startMinutes = timeToMinutes(allowedUpdates.startTime);
      const endMinutes = startMinutes + appointmentDuration;
      allowedUpdates.endTime = `${String(Math.floor(endMinutes / 60)).padStart(
        2,
        "0"
      )}:${String(endMinutes % 60).padStart(2, "0")}`;
    }

    // Apply allowed updates
    Object.assign(appointment, allowedUpdates);
    const updatedAppointment = await appointment.save();

    // Populate for response
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

// DELETE appointment - Kept disabled, recommend using PATCH to cancel
router.delete("/:id", protect, async (req, res) => {
  return res
    .status(405)
    .json({ message: "Deletion not allowed. Cancel instead using PATCH." });
});

module.exports = router;
