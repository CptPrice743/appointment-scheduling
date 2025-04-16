import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  // Function to fetch appointments
  const fetchAppointments = async () => {
    setLoading(true); // Set loading true at the start of fetch
    try {
      const res = await axios.get("http://localhost:8000/api/appointments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Sort appointments: scheduled first, then by date descending
      const sortedAppointments = res.data.sort((a, b) => {
        if (a.status === "scheduled" && b.status !== "scheduled") return -1;
        if (a.status !== "scheduled" && b.status === "scheduled") return 1;
        // If statuses are the same or neither is scheduled, sort by date/time descending
        const dateA = new Date(
          `${a.appointmentDate.split("T")[0]}T${a.appointmentTime}`
        );
        const dateB = new Date(
          `${b.appointmentDate.split("T")[0]}T${b.appointmentTime}`
        );
        return dateB - dateA;
      });
      setAppointments(sortedAppointments);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      // Handle potential token expiration or other auth errors
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        // Optionally logout user or redirect to login
        console.log("Authentication error, redirecting...");
        // logout(); // Assuming logout is available from AuthContext
        // navigate('/login');
      }
    } finally {
      setLoading(false); // Ensure loading is set to false regardless of outcome
    }
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
    } else {
      setLoading(false); // Not authenticated, stop loading
      // Optionally redirect to login
      // navigate('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only re-run if token changes

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await axios.patch(
          `http://localhost:8000/api/appointments/${id}`,
          { status: "cancelled" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Re-fetch appointments to update the list
        fetchAppointments();
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        alert("Failed to cancel appointment. Please try again."); // User feedback
      }
    }
  };

  const handleEdit = (appointment) => {
    // Navigate to the edit form, passing the appointment ID
    navigate(`/edit/${appointment._id}`);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return "Invalid Date"; // Handle potential date parsing errors
    }
  };

  // Helper function to format time
  const formatTime12Hour = (timeStr) => {
    if (!timeStr || !timeStr.includes(":")) return "Invalid Time";
    try {
      const [hour, minute] = timeStr.split(":");
      const date = new Date();
      date.setHours(+hour);
      date.setMinutes(+minute);
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "Invalid Time";
    }
  };

  const scheduledAppointments = appointments.filter(
    (apt) => apt.status === "scheduled"
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status !== "scheduled"
  );

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointment-list">
      <h1
        style={{
          fontSize: "2.5rem",
          marginBottom: "20px",
          marginTop: "10px",
          color: "#2c3e50",
        }}
      >
        Welcome, {user?.name}!
      </h1>

      {/* Scheduled Appointments Section */}
      <h2>Upcoming Appointments</h2>
      {scheduledAppointments.length === 0 ? (
        <p>No upcoming appointments scheduled.</p>
      ) : (
        <div className="appointment-cards">
          {scheduledAppointments.map((appointment) => (
            <div key={appointment._id} className="appointment-card">
              <span className={`status-badge ${appointment.status}`}>
                Scheduled
              </span>
              <h3>{appointment.patientName}</h3>
              <p>
                <strong>Doctor:</strong> {appointment.doctorName}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(appointment.appointmentDate)}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {formatTime12Hour(appointment.appointmentTime)}
              </p>
              <p>
                <strong>Reason:</strong> {appointment.reason}
              </p>
              <p>
                <strong>Email:</strong> {appointment.patientEmail}
              </p>
              <p>
                <strong>Phone:</strong> {appointment.patientPhone}
              </p>
              <div className="appointment-actions">
                <button
                  className="status-badge edit"
                  onClick={() => handleEdit(appointment)}
                >
                  Edit
                </button>
                <button
                  className="status-badge cancel"
                  onClick={() => handleCancel(appointment._id)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment History Section */}
      <h2 style={{ marginTop: "40px" }}>Appointment History</h2>
      {pastAppointments.length === 0 ? (
        <p>No completed or cancelled appointments found.</p>
      ) : (
        <div className="appointment-cards">
          {pastAppointments.map((appointment) => (
            <div key={appointment._id} className="appointment-card">
              <span className={`status-badge ${appointment.status}`}>
                {appointment.status.charAt(0).toUpperCase() +
                  appointment.status.slice(1)}
              </span>
              <h3>{appointment.patientName}</h3>
              <p>
                <strong>Doctor:</strong> {appointment.doctorName}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(appointment.appointmentDate)}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {formatTime12Hour(appointment.appointmentTime)}
              </p>
              <p>
                <strong>Reason:</strong> {appointment.reason}
              </p>
              <p>
                <strong>Email:</strong> {appointment.patientEmail}
              </p>
              <p>
                <strong>Phone:</strong> {appointment.patientPhone}
              </p>
              {/* Display Remarks if Completed */}
              {appointment.status === "completed" && appointment.remarks && (
                <p
                  style={{
                    marginTop: "10px",
                    borderTop: "1px solid #eee",
                    paddingTop: "10px",
                  }}
                >
                  <strong>Remarks:</strong> {appointment.remarks}
                </p>
              )}
              <div className="appointment-actions">
                {/* Optionally allow editing completed/cancelled appointments */}
                <button
                  className="status-badge edit"
                  onClick={() => handleEdit(appointment)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
