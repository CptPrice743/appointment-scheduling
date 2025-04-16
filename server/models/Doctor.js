// File Path: doctor-appointment-scheduling/server/models/Doctor.js
const mongoose = require("mongoose");

// Schema for general weekly slots
const standardAvailabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    startTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "End time must be in HH:MM format"],
    },
  },
  { _id: false }
);

// Schema for specific date overrides
const availabilityOverrideSchema = new mongoose.Schema(
  {
    date: {
      // The specific date for the override (store as Date, query precisely)
      type: Date,
      required: true,
    },
    isWorking: {
      // Flag to mark day as off or working with different hours
      type: Boolean,
      required: true,
      default: true,
    },
    startTime: {
      // Required only if isWorking is true
      type: String,
      match: [/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"],
      required: function () {
        return this.isWorking;
      },
    },
    endTime: {
      // Required only if isWorking is true
      type: String,
      match: [/^\d{2}:\d{2}$/, "End time must be in HH:MM format"],
      required: function () {
        return this.isWorking;
      },
    },
  },
  { _id: false }
);

const DoctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    // Standard weekly availability template
    standardAvailability: [standardAvailabilitySlotSchema],
    // Specific date overrides/exceptions
    availabilityOverrides: [availabilityOverrideSchema],
    appointmentDuration: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
    },
  },
  { timestamps: true }
);

// Pre-validation hook for standard slots
standardAvailabilitySlotSchema.pre("validate", function (next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    next(
      new Error(
        `Standard Availability Error (${this.dayOfWeek}): End time must be after start time.`
      )
    );
  } else {
    next();
  }
});

// Pre-validation hook for override slots
availabilityOverrideSchema.pre("validate", function (next) {
  if (this.isWorking && (!this.startTime || !this.endTime)) {
    next(
      new Error(
        `Override Error (${this.date}): Start and end times are required if marked as working.`
      )
    );
  } else if (this.isWorking && this.startTime >= this.endTime) {
    next(
      new Error(
        `Override Error (${this.date}): End time must be after start time.`
      )
    );
  } else {
    next();
  }
});

// Index for faster override lookup by date
DoctorSchema.index({ "availabilityOverrides.date": 1 });

module.exports = mongoose.model("Doctor", DoctorSchema);
