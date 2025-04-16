import React, { useContext } from "react";
import { Link } from "react-router-dom"; // Import Link
import AuthContext from "../context/AuthContext";
import ScheduleView from "../components/ScheduleView/ScheduleView"; // Corrected path
// Corrected CSS import path assuming the CSS is in the same directory
import "./DoctorDashboard.css";

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== "doctor") {
    // Added a check for doctorProfile loading state if it exists in your context
    // Or rely on the parent route/context to handle loading
    return <div>Loading doctor dashboard or not authorized...</div>;
  }

  return (
    <div className="doctor-dashboard container">
      <h1>Doctor Dashboard</h1>
      <h2>Welcome, Dr. {user.name}!</h2>
      <p>Specialization: {user.doctorProfile?.specialization || "Not set"}</p>
      {/* <p>
        Default Appointment Duration:{" "}
        {user.doctorProfile?.appointmentDuration || "Not set"} minutes
      </p> */}

      {/* Add a clear link to the profile edit page */}
      {/* <div style={{ margin: "15px 0" }}>
        <Link to="/profile/edit" className="cta-button-link">
          Edit Profile & Manage Availability
        </Link>
      </div> */}

      {/* --- Schedule Section --- */}
      <h3 style={{ margin: "15px 0" }}>Your Upcoming Schedule</h3>
      <ScheduleView />

      {/* Removed the Availability Management section from here */}
    </div>
  );
};

export default DoctorDashboard;
