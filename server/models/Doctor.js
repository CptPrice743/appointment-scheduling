const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: { // e.g., 'Monday', 'Tuesday', etc. or number 0-6
    type: String, // Or Number, depending on preference
    required: true,
  },
  startTime: { // e.g., '09:00'
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'],
  },
  endTime: { // e.g., '17:00'
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'],
  },
  // Optional: Add specific dates for overrides or one-off availability
  // specificDate: { type: Date },
  // isAvailable: { type: Boolean, default: true } // To mark specific slots unavailable
});

const DoctorSchema = new mongoose.Schema({
  userId: { // Link to the User account
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Each doctor profile linked to one user
  },
  name: { // This might duplicate User.name but useful for direct doctor queries
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
  // Basic availability structure - can be expanded
  // This defines the general weekly template
  standardAvailability: [availabilitySlotSchema],
  appointmentDuration: { // Default duration in minutes for this doctor
      type: Number,
      required: true,
      default: 60, // Default to 60 minutes if not specified
      min: 5 // Minimum duration
  },
  // You could add more fields like: bio, photoUrl, officeAddress, etc.
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);