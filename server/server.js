// require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const appointmentRoutes = require("./routes/appointmentRoutes");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes"); // Import doctor routes
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 8000;
const MONGO_URI = 'mongodb://localhost:27017/appointmentScheduler';

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined in .env file.");
  process.exit(1); // Exit if DB connection string is missing
}
if (!process.env.JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is not defined in .env file. Using default (unsafe) secret."
  );
}

// --- Middleware ---
// Configure CORS more securely in production
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*", // Allow requests from your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json()); // Parse JSON request bodies

// --- Database Connection ---
mongoose
  .connect(MONGO_URI, {
    // useNewUrlParser and useUnifiedTopology are deprecated but won't harm
    // Add newer options if needed by your Mongoose version
    // Example: serverApi: { version: '1', strict: true, deprecationErrors: true } for MongoDB Atlas
  })
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit on connection failure
  });

// --- Routes ---
app.get("/", (req, res) => res.send("API Running")); // Basic health check route
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes); // Add doctor routes
app.use('/api/users', userRoutes);

// --- Basic Error Handling (Example) ---
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).send("Something broke!");
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the app for testing purposes (if your test setup needs it)
module.exports = app;
