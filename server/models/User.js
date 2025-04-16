const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      // In a real app, ALWAYS hash passwords
      type: String,
      required: true,
    },
    role: {
      // Added role field
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
      required: true,
    },
    doctorProfile: {
      // Link to Doctor model if role is 'doctor'
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: function () {
        return this.role === "doctor";
      }, // Required only for doctors
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
); // Added timestamps for consistency

// Ensure doctorProfile is unique if set (one user maps to max one doctor profile)
UserSchema.index(
  { doctorProfile: 1 },
  {
    unique: true,
    partialFilterExpression: { doctorProfile: { $type: "objectId" } },
  }
);

module.exports = mongoose.model("User", UserSchema);
