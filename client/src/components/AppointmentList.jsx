import React, { useState, useEffect, useMemo, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

// --- Helper Functions ---

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  } catch (e) {
    return "Invalid Date";
  }
};

const formatTime12Hour = (timeStr) => {
  if (!timeStr || !timeStr.includes(":")) return "Invalid Time";
  try {
    const [hour, minute] = timeStr.split(":");
    const date = new Date();
    date.setHours(+hour);
    date.setMinutes(+minute);
    date.setSeconds(0, 0);
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "Invalid Time";
  }
};

const getDateTime = (appointment) => {
  try {
    const datePart = appointment.appointmentDate.split("T")[0];
    const dateTimeString = `${datePart}T${appointment.appointmentTime}:00`;
    return new Date(dateTimeString);
  } catch (e) {
    console.error("Error creating date object for:", appointment, e);
    return new Date(NaN);
  }
};

// --- Placeholder Doctor Data (Copied from AppointmentForm - Ideally fetch from API/Context) ---
const doctors = [
  { id: 1, name: "Dr. Smith", type: "Cardiologist" },
  { id: 2, name: "Dr. Johnson", type: "Pediatrician" },
  { id: 3, name: "Dr. Williams", type: "Dermatologist" },
  { id: 4, name: "Dr. Brown", type: "General Practitioner" },
];

// Function to find doctor type by name
const getDoctorType = (doctorName) => {
  const doctor = doctors.find((doc) => doc.name === doctorName);
  return doctor ? doctor.type : null; // Return type or null if not found
};

// --- Component ---

const AppointmentList = () => {
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  // State for filters
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Function to fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllAppointments(res.data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Derive unique doctors for filter dropdown (from actual appointment data)
  const uniqueDoctorsForFilter = useMemo(() => {
    const doctorsInAppointments = new Set(
      allAppointments.map((apt) => apt.doctorName).filter(Boolean)
    );
    return ["", ...Array.from(doctorsInAppointments).sort()];
  }, [allAppointments]);

  const uniqueStatuses = ["", "scheduled", "completed", "cancelled"];

  // Categorize and Sort Appointments
  const categorizedAppointments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let filtered = [...allAppointments];

    // Apply filters
    if (filterDoctor) {
      filtered = filtered.filter((apt) => apt.doctorName === filterDoctor);
    }
    if (filterStatus) {
      filtered = filtered.filter((apt) => apt.status === filterStatus);
    }

    const categories = {
      today: [],
      pending: [],
      upcoming: [],
      history: [],
    };

    filtered.forEach((apt) => {
      const aptDateTime = getDateTime(apt);
      if (isNaN(aptDateTime)) {
        console.warn("Skipping appointment with invalid date/time:", apt);
        return;
      }

      const aptDateOnly = new Date(aptDateTime);
      aptDateOnly.setHours(0, 0, 0, 0);

      if (apt.status === "scheduled") {
        if (aptDateOnly.getTime() === todayStart.getTime()) {
          if (aptDateTime >= now) {
            categories.today.push(apt);
          } else {
            categories.pending.push(apt);
          }
        } else if (aptDateOnly < todayStart) {
          categories.pending.push(apt);
        } else {
          categories.upcoming.push(apt);
        }
      } else {
        categories.history.push(apt);
      }
    });

    // Sort categories
    categories.today.sort((a, b) => getDateTime(a) - getDateTime(b));
    categories.pending.sort((a, b) => getDateTime(b) - getDateTime(a));
    categories.upcoming.sort((a, b) => getDateTime(a) - getDateTime(b));
    categories.history.sort((a, b) => getDateTime(b) - getDateTime(a));

    return categories;
  }, [allAppointments, filterDoctor, filterStatus]);

  // Action Handlers
  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        setLoading(true);
        await axios.patch(
          `http://localhost:8000/api/appointments/${id}`,
          { status: "cancelled" },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchAppointments();
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        alert("Failed to cancel appointment. Please try again.");
        setLoading(false);
      }
    }
  };

  const handleEdit = (appointment) => {
    navigate(`/edit/${appointment._id}`);
  };

  // --- Render Function for Cards ---
  const renderAppointmentCard = (appointment, section) => {
    let statusText =
      appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);
    let statusClass = appointment.status;
    const doctorType = getDoctorType(appointment.doctorName); // Get doctor type

    if (section === "pending") {
      statusText = "Pending";
      statusClass = "pending-status";
    }

    return (
      <div key={appointment._id} className="appointment-card">
        <span className={`status-badge ${statusClass}`}>{statusText}</span>
        <h3>{appointment.patientName}</h3>
        {/* Updated Doctor Display */}
        <p>
          <strong>Doctor:</strong> {appointment.doctorName}
          {doctorType ? ` (${doctorType})` : ""} {/* Conditionally add type */}
        </p>
        <p>
          <strong>Date:</strong> {formatDate(appointment.appointmentDate)}
        </p>
        <p>
          <strong>Time:</strong> {formatTime12Hour(appointment.appointmentTime)}
        </p>
        <p>
          <strong>Reason:</strong> {appointment.reason}
        </p>
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
          {section === "pending" && (
            <>
              <button
                className="status-badge edit"
                onClick={() => handleEdit(appointment)}
              >
                Reschedule
              </button>
              <button
                className="status-badge cancel"
                onClick={() => handleCancel(appointment._id)}
              >
                Cancel
              </button>
            </>
          )}
          {section !== "pending" && appointment.status === "scheduled" && (
            <>
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
            </>
          )}
          {section === "history" && (
            <button
              className="status-badge edit"
              onClick={() => handleEdit(appointment)}
            >
              View/Edit
            </button>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render ---
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

      {/* Filters */}
      <div
        className="controls-container"
        style={{
          marginBottom: "30px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <label
            htmlFor="filterDoctor"
            style={{ marginRight: "8px", fontWeight: "bold" }}
          >
            Filter by Doctor:
          </label>
          <select
            id="filterDoctor"
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            {/* Use uniqueDoctorsForFilter derived from actual appointments */}
            {uniqueDoctorsForFilter.map((doc) => (
              <option key={doc || "all-doctors"} value={doc}>
                {doc || "All Doctors"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filterStatus"
            style={{ marginRight: "8px", fontWeight: "bold" }}
          >
            Filter by Status:
          </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            {uniqueStatuses.map((status) => (
              <option key={status || "all-statuses"} value={status}>
                {status
                  ? status.charAt(0).toUpperCase() + status.slice(1)
                  : "All Statuses"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Today's Appointments */}
      {(filterStatus === "" || filterStatus === "scheduled") && (
        <>
          <h2>Today's Appointments</h2>
          {categorizedAppointments.today.length === 0 ? (
            <p>No appointments scheduled for later today.</p>
          ) : (
            <div className="appointment-cards">
              {categorizedAppointments.today.map((apt) =>
                renderAppointmentCard(apt, "today")
              )}
            </div>
          )}
        </>
      )}

      {/* Pending Update */}
      {(filterStatus === "" || filterStatus === "scheduled") && (
        <>
          <h2 style={{ marginTop: "40px" }}>Pending Update</h2>
          {categorizedAppointments.pending.length === 0 ? (
            <p>No appointments require updates at this time.</p>
          ) : (
            <div className="appointment-cards">
              {categorizedAppointments.pending.map((apt) =>
                renderAppointmentCard(apt, "pending")
              )}
            </div>
          )}
        </>
      )}

      {/* Upcoming Appointments */}
      {(filterStatus === "" || filterStatus === "scheduled") && (
        <>
          <h2 style={{ marginTop: "40px" }}>Upcoming Appointments</h2>
          {categorizedAppointments.upcoming.length === 0 ? (
            <p>No upcoming appointments scheduled beyond today.</p>
          ) : (
            <div className="appointment-cards">
              {categorizedAppointments.upcoming.map((apt) =>
                renderAppointmentCard(apt, "upcoming")
              )}
            </div>
          )}
        </>
      )}

      {/* Appointment History */}
      {(filterStatus === "" ||
        filterStatus === "completed" ||
        filterStatus === "cancelled") && (
        <>
          <h2 style={{ marginTop: "40px" }}>Appointment History</h2>
          {categorizedAppointments.history.length === 0 ? (
            <p>
              No completed or cancelled appointments found matching the current
              filters.
            </p>
          ) : (
            <div className="appointment-cards">
              {categorizedAppointments.history.map((apt) =>
                renderAppointmentCard(apt, "history")
              )}
            </div>
          )}
        </>
      )}

      {/* Fallback message */}
      {!loading &&
        !categorizedAppointments.today.length &&
        !categorizedAppointments.pending.length &&
        !categorizedAppointments.upcoming.length &&
        !categorizedAppointments.history.length &&
        (filterDoctor || filterStatus) && (
          <p style={{ marginTop: "20px" }}>
            No appointments match the current filter criteria.
          </p>
        )}
      {!loading &&
        !categorizedAppointments.today.length &&
        !categorizedAppointments.pending.length &&
        !categorizedAppointments.upcoming.length &&
        !categorizedAppointments.history.length &&
        !filterDoctor &&
        !filterStatus && (
          <p style={{ marginTop: "20px" }}>You have no appointments yet.</p>
        )}
    </div>
  );
};

export default AppointmentList;
