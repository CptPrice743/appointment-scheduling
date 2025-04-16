// File Path: doctor-appointment-scheduling/server/routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Appointment = require("../models/appointment"); // To check existing bookings
const { protect, isDoctor } = require("../middleware/authMiddleware");
const { timeToMinutes, generateTimeSlots, getDayOfWeekString } = require('../utils/timeUtils'); // Assuming utils file exists

// --- Doctor Profile Routes ---
router.get("/profile/me", protect, isDoctor, async (req, res) => {
  try {
    if (!req.user.doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found for this user." });
    }
    // doctorProfile should already be populated by 'protect' middleware
    res.json(req.user.doctorProfile);
  } catch (err) {
    console.error("Error fetching doctor profile:", err);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

router.patch("/profile/me", protect, isDoctor, async (req, res) => {
  const { specialization, appointmentDuration } = req.body;
  const updates = {};
  if (specialization !== undefined) updates.specialization = specialization;
  if (appointmentDuration !== undefined) {
      const durationNum = parseInt(appointmentDuration);
      if (isNaN(durationNum) || durationNum <= 0) {
          return res.status(400).json({ message: "Invalid appointment duration." });
      }
      updates.appointmentDuration = durationNum;
  }

  if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update." });
  }

  try {
      if (!req.user.doctorProfile?._id) {
         return res.status(404).json({ message: "Doctor profile ID not found for this user." });
      }
      const doctor = await Doctor.findByIdAndUpdate(
          req.user.doctorProfile._id,
          { $set: updates },
          { new: true, runValidators: true }
      );

      if (!doctor) {
          return res.status(404).json({ message: "Doctor profile not found." });
      }
      res.json(doctor);
  } catch (err) {
      console.error("Error updating doctor profile:", err);
      if (err.name === 'ValidationError') {
          return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: "Server error updating profile" });
  }
});


// --- Standard Weekly Availability Routes ---
router.get("/availability/standard", protect, isDoctor, async (req, res) => {
  try {
    if (!req.user.doctorProfile?._id) {
      return res.status(404).json({ message: "Doctor profile ID not found." });
    }
    const doctor = await Doctor.findById(req.user.doctorProfile._id).select("standardAvailability");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor availability not found." });
    }
    res.json(doctor.standardAvailability || []);
  } catch (err) {
    console.error("Error fetching standard availability:", err);
    res.status(500).json({ message: "Server error fetching availability" });
  }
});

router.put("/availability/standard", protect, isDoctor, async (req, res) => {
  const { availabilitySlots } = req.body; // Expecting an array of slots

  if (!req.user.doctorProfile?._id) {
    return res.status(404).json({ message: "Doctor profile ID not found." });
  }

  if (!Array.isArray(availabilitySlots)) {
    return res.status(400).json({ message: "Availability slots must be an array." });
  }

  // Basic validation for each slot
  const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeRegex = /^\d{2}:\d{2}$/;
  for (const slot of availabilitySlots) {
    if (!slot.dayOfWeek || !validDays.includes(slot.dayOfWeek)) {
      return res.status(400).json({ message: `Invalid or missing dayOfWeek: ${slot.dayOfWeek}` });
    }
    if (!slot.startTime || !timeRegex.test(slot.startTime)) {
      return res.status(400).json({ message: `Invalid or missing startTime format (HH:MM): ${slot.startTime}` });
    }
    if (!slot.endTime || !timeRegex.test(slot.endTime)) {
      return res.status(400).json({ message: `Invalid or missing endTime format (HH:MM): ${slot.endTime}` });
    }
    if (slot.startTime >= slot.endTime) {
       return res.status(400).json({ message: `End time (${slot.endTime}) must be after start time (${slot.startTime}) for ${slot.dayOfWeek}` });
    }
  }

  try {
    const doctor = await Doctor.findById(req.user.doctorProfile._id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    doctor.standardAvailability = availabilitySlots;
    await doctor.save(); // Triggers schema validation

    res.json(doctor.standardAvailability);
  } catch (err) {
    console.error("Error setting standard availability:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: `Validation Error: ${err.message}` });
    }
    res.status(500).json({ message: "Server error setting availability" });
  }
});


// --- Availability Overrides Management ---
router.get("/availability/overrides", protect, isDoctor, async (req, res) => {
    try {
        if (!req.user.doctorProfile?._id) {
            return res.status(404).json({ message: "Doctor profile ID not found." });
        }
        const doctor = await Doctor.findById(req.user.doctorProfile._id).select("availabilityOverrides");
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found." });
        }

        // Filter out past overrides before sending
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const upcomingOverrides = (doctor.availabilityOverrides || []).filter(ov => ov.date >= today);

        res.json(upcomingOverrides);
    } catch (err) {
        console.error("Error fetching availability overrides:", err);
        res.status(500).json({ message: "Server error fetching overrides" });
    }
});

router.post("/availability/overrides", protect, isDoctor, async (req, res) => {
    const { date, isWorking, startTime, endTime } = req.body;

    if (!date) {
        return res.status(400).json({ message: "Date is required for override." });
    }
    if (typeof isWorking !== 'boolean') {
        return res.status(400).json({ message: "isWorking flag (true/false) is required." });
    }

    let overrideDate;
    try {
         overrideDate = new Date(date + 'T00:00:00Z');
         if (isNaN(overrideDate.getTime())) throw new Error();
    } catch(e) {
         return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    const overrideData = {
        date: overrideDate,
        isWorking: isWorking
    };

    if (isWorking) {
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!startTime || !timeRegex.test(startTime) || !endTime || !timeRegex.test(endTime)) {
             return res.status(400).json({ message: "Valid startTime and endTime (HH:MM) are required if working." });
        }
        if (startTime >= endTime) {
             return res.status(400).json({ message: "End time must be after start time for override." });
        }
        overrideData.startTime = startTime;
        overrideData.endTime = endTime;
    } else {
        overrideData.startTime = undefined;
        overrideData.endTime = undefined;
    }

    try {
        if (!req.user.doctorProfile?._id) {
            return res.status(404).json({ message: "Doctor profile ID not found." });
        }
        const doctor = await Doctor.findById(req.user.doctorProfile._id);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found." });
        }

        const existingOverrideIndex = doctor.availabilityOverrides.findIndex(
            ov => ov.date.toISOString().split('T')[0] === overrideDate.toISOString().split('T')[0]
        );

        if (existingOverrideIndex > -1) {
            doctor.availabilityOverrides[existingOverrideIndex] = overrideData;
        } else {
            doctor.availabilityOverrides.push(overrideData);
        }
        doctor.availabilityOverrides.sort((a, b) => a.date - b.date);

        await doctor.save();
        res.status(200).json(overrideData);

    } catch (err) {
        console.error("Error setting availability override:", err);
         if (err.name === 'ValidationError') {
             return res.status(400).json({ message: `Validation Error: ${err.message}` });
         }
        res.status(500).json({ message: "Server error setting override" });
    }
});

router.delete("/availability/overrides/:date", protect, isDoctor, async (req, res) => {
    const { date } = req.params;

    let overrideDate;
     try {
          overrideDate = new Date(date + 'T00:00:00Z');
          if (isNaN(overrideDate.getTime())) throw new Error();
     } catch(e) {
          return res.status(400).json({ message: "Invalid date format in URL. Use YYYY-MM-DD." });
     }

    try {
         if (!req.user.doctorProfile?._id) {
             return res.status(404).json({ message: "Doctor profile ID not found." });
         }
         const doctor = await Doctor.findById(req.user.doctorProfile._id);
         if (!doctor) {
             return res.status(404).json({ message: "Doctor profile not found." });
         }

         const initialLength = doctor.availabilityOverrides.length;
         doctor.availabilityOverrides = doctor.availabilityOverrides.filter(
             ov => ov.date.toISOString().split('T')[0] !== overrideDate.toISOString().split('T')[0]
         );

         if (doctor.availabilityOverrides.length === initialLength) {
             return res.status(404).json({ message: "Override for this date not found." });
         }

         await doctor.save();
         res.status(200).json({ message: `Override for ${date} deleted successfully.` });

    } catch (err) {
         console.error("Error deleting availability override:", err);
         res.status(500).json({ message: "Server error deleting override" });
    }
});


// --- Get Available Slots for Booking ---
router.get("/:doctorId/available-slots", protect, async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: "Date query parameter is required." });
    }

    let requestedDate;
    try {
        requestedDate = new Date(date + 'T00:00:00Z');
        if (isNaN(requestedDate.getTime())) throw new Error();
    } catch(e) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found." });
        }

        const appointmentDuration = doctor.appointmentDuration;
        let dayStartTime = null;
        let dayEndTime = null;
        let isWorkingToday = false;

        // Check for specific override
        const dateString = requestedDate.toISOString().split('T')[0];
        const override = doctor.availabilityOverrides.find(ov => ov.date.toISOString().split('T')[0] === dateString);

        if (override) {
            if (!override.isWorking) {
                return res.json([]); // Not working
            }
            isWorkingToday = true;
            dayStartTime = override.startTime;
            dayEndTime = override.endTime;
        } else {
            // Use standard availability
            const dayOfWeek = getDayOfWeekString(requestedDate.getUTCDay());
            const availabilityRule = doctor.standardAvailability.find(slot => slot.dayOfWeek === dayOfWeek);
            if (availabilityRule) {
                isWorkingToday = true;
                dayStartTime = availabilityRule.startTime;
                dayEndTime = availabilityRule.endTime;
            }
        }

        if (!isWorkingToday || !dayStartTime || !dayEndTime) {
            return res.json([]); // Not working today
        }

        // Generate potential slots
        const potentialSlots = generateTimeSlots(dayStartTime, dayEndTime, appointmentDuration);

        // Filter based on existing appointments
        const startOfDay = new Date(Date.UTC(requestedDate.getUTCFullYear(), requestedDate.getUTCMonth(), requestedDate.getUTCDate()));
        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

        const existingAppointments = await Appointment.find({
            doctorId: doctorId,
            status: { $in: ["scheduled"] },
            appointmentDate: { $gte: startOfDay, $lt: endOfDay },
        });

        const finalAvailableSlots = potentialSlots.filter(slotStartTime => {
             const slotStartMinutes = timeToMinutes(slotStartTime);
             const slotEndMinutes = slotStartMinutes + appointmentDuration;
             for (const existing of existingAppointments) {
                 const existingStartMinutes = timeToMinutes(existing.startTime);
                 const existingEndMinutes = timeToMinutes(existing.endTime);
                 if (slotStartMinutes < existingEndMinutes && slotEndMinutes > existingStartMinutes) {
                     return false; // Conflict
                 }
             }
             return true; // No conflict
        });

        res.json(finalAvailableSlots);

    } catch (err) {
        console.error("Error fetching available slots:", err);
        if (err.kind === 'ObjectId') {
           return res.status(404).json({ message: "Doctor not found (invalid ID)." });
        }
        res.status(500).json({ message: "Server error fetching available slots." });
    }
});


// --- Doctor's Appointments Schedule ---
// ** RESTORED HANDLER **
router.get("/appointments/my-schedule", protect, isDoctor, async (req, res) => {
    try {
        if (!req.user.doctorProfile?._id) {
            return res.status(404).json({ message: "Doctor profile not found." });
        }
        const doctorId = req.user.doctorProfile._id;
        const appointments = await Appointment.find({ doctorId: doctorId })
            .populate('patientUserId', 'name email') // Populate patient details
            .sort({ appointmentDate: 1, startTime: 1 }); // Sort chronologically
        res.json(appointments);
    } catch (err) {
        console.error("Error fetching doctor's schedule:", err);
        res.status(500).json({ message: "Server error fetching schedule" });
    }
});

// --- Public Doctor Routes ---
// ** RESTORED HANDLER **
router.get("/list", async (req, res) => {
    try {
        const doctors = await Doctor.find({})
          .select('name specialization appointmentDuration _id'); // Include duration
        res.json(doctors);
    } catch (err) {
        console.error("Error fetching doctor list:", err);
        res.status(500).json({ message: "Server error fetching doctors" });
    }
});

// ** RESTORED HANDLER **
router.get("/:doctorId", async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.doctorId)
            .select('name specialization standardAvailability appointmentDuration availabilityOverrides'); // Include overrides maybe? Decide if public

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (err) {
        console.error('Error fetching public doctor profile:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Doctor not found (Invalid ID)' });
        }
        res.status(500).json({ message: 'Server error fetching doctor profile' });
    }
});

module.exports = router;