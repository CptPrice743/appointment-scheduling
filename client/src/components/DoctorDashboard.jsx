import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ScheduleView from "./ScheduleView"; // Component to show appointments
// import AvailabilityManager from './AvailabilityManager'; // Component to manage availability

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);

  // Basic check, might want more robust loading/error states
  if (!user || user.role !== "doctor") {
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

      {/* Embed the schedule view */}
      <ScheduleView />

      {/* Placeholder for Availability Manager */}
      {/* <div style={{ marginTop: '40px' }}>
            <h2>Manage Availability</h2>
            <AvailabilityManager />
       </div> */}
    </div>
  );
};

export default DoctorDashboard;
