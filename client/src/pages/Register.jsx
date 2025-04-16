import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";
// Corrected CSS import path assuming the CSS is in the same directory
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient", // Default role
    // Doctor specific
    specialization: "",
    appointmentDuration: "30",
    // New simplified availability fields
    weekdayStartTime: "09:00",
    weekdayEndTime: "17:00",
    worksWeekends: false,
    weekendStartTime: "10:00",
    weekendEndTime: "14:00",
  });

  const [formError, setFormError] = useState(""); // Combined error state

  const {
    register,
    isAuthenticated,
    error: authError,
    clearError,
    isLoading,
  } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear errors on change
    clearError();
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError(); // Clear auth context errors
    setFormError(""); // Clear form-specific errors

    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      specialization,
      appointmentDuration,
      weekdayStartTime,
      weekdayEndTime,
      worksWeekends,
      weekendStartTime,
      weekendEndTime,
    } = formData;

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    // --- Prepare Data Based on Role ---
    const registrationData = { name, email, password, role };

    if (role === "doctor") {
      // Basic Doctor Field Validation
      if (
        !specialization ||
        !appointmentDuration ||
        parseInt(appointmentDuration) <= 0
      ) {
        setFormError(
          "Specialization and a valid positive Appointment Duration are required for doctors."
        );
        return;
      }
      registrationData.specialization = specialization;
      registrationData.appointmentDuration = parseInt(appointmentDuration);

      // Availability Validation
      if (
        !weekdayStartTime ||
        !weekdayEndTime ||
        weekdayStartTime >= weekdayEndTime
      ) {
        setFormError(
          "Valid weekday start and end times are required, end time must be after start time."
        );
        return;
      }
      registrationData.weekdayStartTime = weekdayStartTime;
      registrationData.weekdayEndTime = weekdayEndTime;
      registrationData.worksWeekends = worksWeekends;

      if (worksWeekends) {
        if (
          !weekendStartTime ||
          !weekendEndTime ||
          weekendStartTime >= weekendEndTime
        ) {
          setFormError(
            "Valid weekend start and end times are required if working weekends, end time must be after start time."
          );
          return;
        }
        registrationData.weekendStartTime = weekendStartTime;
        registrationData.weekendEndTime = weekendEndTime;
      }
    }
    // --- End Data Preparation ---

    await register(registrationData);
    // Navigation is handled by the useEffect hook
  };

  return (
    <div className="appointment-form-container">
      <h2>Register</h2>

      {/* Display combined errors */}
      {(authError || formError) && (
        <div className="message error">{authError || formError}</div>
      )}

      <form onSubmit={handleSubmit} className="appointment-form">
        {/* Role Selection */}
        <div className="form-group">
          <label htmlFor="role">Register As</label>
          <select
            id="role"
            name="role"
            value={formData.role}
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
            value={formData.name}
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
            value={formData.email}
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
            value={formData.password}
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
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>

        {/* --- Doctor Specific Fields --- */}
        {formData.role === "doctor" && (
          <>
            <div className="form-group">
              <label htmlFor="specialization">Specialization</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
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
                value={formData.appointmentDuration}
                onChange={handleChange}
                required
                min="5"
              />
            </div>

            {/* Simplified Availability */}
            <fieldset className="availability-fieldset">
              <legend>Standard Availability</legend>
              <div className="form-group time-range">
                <label>Weekdays (Mon-Fri)</label>
                <div>
                  <input
                    type="time"
                    name="weekdayStartTime"
                    value={formData.weekdayStartTime}
                    onChange={handleChange}
                    required
                  />
                  <span> to </span>
                  <input
                    type="time"
                    name="weekdayEndTime"
                    value={formData.weekdayEndTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="worksWeekends"
                  name="worksWeekends"
                  checked={formData.worksWeekends}
                  onChange={handleChange}
                />
                <label htmlFor="worksWeekends">
                  Work on Weekends (Sat-Sun)?
                </label>
              </div>
              {formData.worksWeekends && (
                <div className="form-group time-range">
                  <label>Weekends (Sat-Sun)</label>
                  <div>
                    <input
                      type="time"
                      name="weekendStartTime"
                      value={formData.weekendStartTime}
                      onChange={handleChange}
                      required
                    />
                    <span> to </span>
                    <input
                      type="time"
                      name="weekendEndTime"
                      value={formData.weekendEndTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}
            </fieldset>
          </>
        )}
        {/* --- End Doctor Specific Fields --- */}

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
