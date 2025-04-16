import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient", // Default role
    specialization: "", // Doctor specific
    appointmentDuration: "30", // Doctor specific, default to 30 mins
  });

  const [passwordError, setPasswordError] = useState("");

  const {
    name,
    email,
    password,
    confirmPassword,
    role,
    specialization,
    appointmentDuration,
  } = formData;
  const { register, isAuthenticated, error, clearError, isLoading } =
    useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If logged in after registration, redirect based on role
    if (isAuthenticated) {
      // Navigate to the role-based redirector which will handle the final destination
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear errors on change
    clearError();
    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError(); // Clear previous errors
    setPasswordError(""); // Clear password mismatch error

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // Prepare data based on role
    const registrationData = { name, email, password, role };
    if (role === "doctor") {
      if (
        !specialization ||
        !appointmentDuration ||
        parseInt(appointmentDuration) <= 0
      ) {
        setPasswordError(
          "Specialization and a valid positive Appointment Duration are required for doctors."
        );
        return;
      }
      registrationData.specialization = specialization;
      registrationData.appointmentDuration = parseInt(appointmentDuration);
    }

    await register(registrationData);
    // Navigation is handled by the useEffect hook now
  };

  return (
    <div className="appointment-form-container">
      <h2>Register</h2>

      {error && <div className="message error">{error}</div>}
      {passwordError && <div className="message error">{passwordError}</div>}

      <form onSubmit={handleSubmit} className="appointment-form">
        {/* Role Selection */}
        <div className="form-group">
          <label htmlFor="role">Register As</label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={handleChange}
            required
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>

        {/* Common Fields */}
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>

        {/* Doctor Specific Fields */}
        {role === "doctor" && (
          <>
            <div className="form-group">
              <label htmlFor="specialization">Specialization</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={specialization}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="appointmentDuration">
                Default Appt. Duration (minutes)
              </label>
              <input
                type="number"
                id="appointmentDuration"
                name="appointmentDuration"
                value={appointmentDuration}
                onChange={handleChange}
                required
                min="5"
              />
            </div>
          </>
        )}

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default Register;
