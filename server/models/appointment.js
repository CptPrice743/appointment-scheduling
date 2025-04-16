const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  patientEmail: {
    type: String,
    required: true,
  },
  patientPhone: {
    type: String,
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
  // Added field for doctor remarks
  remarks: {
    type: String,
    trim: true, // Removes leading/trailing whitespace
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // Not marking as required to maintain backward compatibility
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
