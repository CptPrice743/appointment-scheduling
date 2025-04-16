const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    patientName: {
      // Kept for direct display, but linked via userId
      type: String,
      required: true,
    },
    patientUserId: {
      // Link to the patient User model
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorUserId: {
      // Link to the doctor User model
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      // Link to the Doctor profile model
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    // Added patientPhone field
    patientPhone: {
      type: String,
      trim: true, // Trim whitespace
      default: "", // Default to empty string
    },
    appointmentDate: {
      // Store the specific date of the appointment
      type: Date,
      required: true,
    },
    startTime: {
      // Store the specific start time
      type: String, // HH:MM format
      required: true,
      match: [/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"],
    },
    endTime: {
      // Calculated or stored end time
      type: String, // HH:MM format
      required: true,
      match: [/^\d{2}:\d{2}$/, "End time must be in HH:MM format"],
    },
    duration: {
      // Duration in minutes for this specific appointment
      type: Number,
      required: true,
      min: 5,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "noshow"], // Added 'noshow'
      default: "scheduled",
    },
    remarks: {
      // Doctor's notes about the appointment
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
); // Add timestamps

// Index for efficient querying by doctor and date
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
// Index for patient appointments
AppointmentSchema.index({ patientUserId: 1, appointmentDate: 1 });

module.exports = mongoose.model("Appointment", AppointmentSchema);
