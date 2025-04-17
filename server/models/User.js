// server/models/User.js
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
      select: false, // Explicitly exclude password by default
    },
    role: {
      // Added role field
      type: String,
      // *** MODIFIED ENUM TO INCLUDE ADMIN ***
      enum: ["patient", "doctor", "admin"], // <-- Added 'admin'
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
    // Optional: Add an isActive flag later for Step 2
    isActive: {
      type: Boolean,
      default: true,
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

// Re-add select: false for password after hashing in routes if needed there
// This ensures it's not returned unless explicitly selected (like in login)
UserSchema.pre("save", async function (next) {
  // Hash password logic would typically be here if not handled in route
  next();
});

// Explicitly exclude password when converting to JSON unless selected
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model("User", UserSchema);
