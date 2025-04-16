import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "./AppointmentList.css";

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  } catch (e) {
    return "Invalid Date";
  }
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
};

const formatTime12Hour = (timeStr) => {
  if (!timeStr || !timeStr.includes(":")) return "N/A";
  try {
    const [hour, minute] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hour, 10));
    date.setMinutes(parseInt(minute, 10));
    if (isNaN(date.getHours()) || isNaN(date.getMinutes()))
      return "Invalid Time";
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "Invalid Time";
  }
};

const getAppointmentDateTime = (appointment) => {
  try {
    if (!appointment || !appointment.appointmentDate)
      throw new Error("Appointment or appointmentDate missing");
    const dateObj = new Date(appointment.appointmentDate);
    if (isNaN(dateObj.getTime()))
      throw new Error("Invalid appointmentDate parsed");
    if (!appointment.startTime || !appointment.startTime.includes(":"))
      throw new Error("Invalid startTime format");
    const [hours, minutes] = appointment.startTime.split(":").map(Number);
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    )
      throw new Error("Invalid time parts");
    const dateTimeResult = new Date(dateObj);
    dateTimeResult.setUTCHours(hours, minutes, 0, 0);
    if (isNaN(dateTimeResult.getTime()))
      throw new Error("Invalid date after setting time");
    return dateTimeResult;
  } catch (e) {
    console.error(
      `Error in getAppointmentDateTime for ID ${appointment?._id}:`,
      e.message
    );
    return new Date(NaN);
  }
};

const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

// --- Component ---
const AppointmentList = () => {
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { token, user, axiosInstance } = useContext(AuthContext);

  // --- Filter States ---
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);

  // Fetch doctors list (for filter dropdown)
  useEffect(() => {
    axiosInstance
      .get("/doctors/list")
      .then((res) => {
        setDoctorsList(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching doctor list for filter:", err);
      });
  }, [axiosInstance]);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/appointments/my-appointments");
      setAllAppointments(res.data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(err.response?.data?.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "patient") {
      fetchAppointments();
    } else if (user?.role && user.role !== "patient") {
      setError("Access denied. This view is for patients.");
      setLoading(false);
    } else if (!token || !user) {
      setError("");
      setAllAppointments([]);
      setLoading(false);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  // Filter, Categorize and Sort Appointments based on filters
  const categorizedAppointments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let filtered = allAppointments.filter((apt) => {
      const aptDateTime = getAppointmentDateTime(apt);
      if (isNaN(aptDateTime?.getTime())) {
        return !filterStartDate && !filterEndDate;
      }
      const aptDateOnly = new Date(aptDateTime);
      aptDateOnly.setHours(0, 0, 0, 0);

      const doctorMatch = filterDoctor
        ? apt.doctorId?._id === filterDoctor
        : true;
      const statusMatch = filterStatus ? apt.status === filterStatus : true;
      const startDateMatch = filterStartDate
        ? aptDateOnly >= new Date(filterStartDate + "T00:00:00Z")
        : true;
      const endDateMatch = filterEndDate
        ? aptDateOnly <= new Date(filterEndDate + "T00:00:00Z")
        : true;

      return doctorMatch && statusMatch && startDateMatch && endDateMatch;
    });

    const categories = {
      today: [],
      pendingUpdate: [],
      upcoming: [],
      history: [],
    };

    filtered.forEach((apt) => {
      const aptDateTime = getAppointmentDateTime(apt);
      if (isNaN(aptDateTime?.getTime())) {
        categories.history.push(apt);
        return;
      }
      const aptDateOnly = new Date(aptDateTime);
      aptDateOnly.setHours(0, 0, 0, 0);

      if (apt.status === "scheduled") {
        if (isToday(aptDateOnly)) {
          if (aptDateTime >= now) {
            categories.today.push(apt);
          } else {
            categories.pendingUpdate.push(apt);
          }
        } else if (aptDateTime > now) {
          categories.upcoming.push(apt);
        } else {
          categories.pendingUpdate.push(apt);
        }
      } else {
        categories.history.push(apt);
      }
    });

    categories.today.sort(
      (a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b)
    );
    categories.upcoming.sort(
      (a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b)
    );
    categories.pendingUpdate.sort(
      (a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a)
    );
    categories.history.sort(
      (a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a)
    );

    return categories;
  }, [
    allAppointments,
    filterDoctor,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);

  // --- Action Handlers ---
  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      setError("");
      setLoading(true);
      try {
        await axiosInstance.patch(`/appointments/${id}`, {
          status: "cancelled",
        });
        await fetchAppointments(); // Refresh list
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        setError(
          err.response?.data?.message || "Failed to cancel appointment."
        );
        setLoading(false); // Important on error
      }
    }
  };

  const handleReschedule = (appointmentId) => {
    navigate(`/edit/${appointmentId}`);
  };

  // Handler for Book Again
  const handleBookAgain = (appointment) => {
    if (!appointment.doctorId?._id) {
      console.error(
        "Cannot rebook, doctor ID missing from appointment data:",
        appointment
      );
      setError("Could not prefill doctor information for rebooking.");
      return;
    }
    console.log("Navigating to /add with prefill:", {
      doctorId: appointment.doctorId._id,
      reason: appointment.reason,
    });
    navigate("/add", {
      state: {
        prefillData: {
          doctorId: appointment.doctorId._id, // Pass doctor ID
          reason: appointment.reason, // Pass reason
        },
      },
    });
  };

  // --- Render Function for Cards ---
  const renderAppointmentCard = (appointment, section) => {
    if (!appointment || !appointment._id) return null;
    const isPastScheduled =
      section === "pendingUpdate" && appointment.status === "scheduled";

    let displayStatus = appointment.status
      ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)
      : "Unknown";
    if (displayStatus === "Noshow") displayStatus = "No Show";
    if (isPastScheduled) displayStatus = "Pending";

    let badgeClass = `status-${appointment.status}`;
    if (isPastScheduled) badgeClass = "status-pending";

    return (
      <div key={appointment._id} className="appointment-card">
        <div className="card-header">
          <h3>{appointment.doctorId?.name || "N/A"}</h3>
          <span className={`status-badge ${badgeClass}`}>{displayStatus}</span>
        </div>
        <p>
          <strong>Specialization:</strong>{" "}
          {appointment.doctorId?.specialization || "N/A"}
        </p>
        <p>
          <strong>Date:</strong> {formatDate(appointment.appointmentDate)}
        </p>
        <p>
          <strong>Time:</strong> {formatTime12Hour(appointment.startTime)} -{" "}
          {formatTime12Hour(appointment.endTime)} ({appointment.duration} mins)
        </p>
        <p>
          <strong>Reason:</strong> {appointment.reason}
        </p>
        {appointment.status === "completed" && appointment.remarks && (
          <p className="remarks">
            <strong>Doctor's Remarks:</strong> {appointment.remarks}
          </p>
        )}
        <div className="appointment-actions">
          {section === "pendingUpdate" && (
            <>
              <button
                className="action-button reschedule"
                onClick={() => handleReschedule(appointment._id)}
              >
                Reschedule
              </button>
              <button
                className="action-button cancel"
                onClick={() => handleCancel(appointment._id)}
              >
                Cancel
              </button>
            </>
          )}
          {(section === "today" || section === "upcoming") && (
            <>
              <button
                className="action-button edit"
                onClick={() => handleReschedule(appointment._id)}
              >
                Edit Details
              </button>
              <button
                className="action-button cancel"
                onClick={() => handleCancel(appointment._id)}
              >
                Cancel
              </button>
            </>
          )}
          {/* *** MODIFIED: History Section Buttons Logic *** */}
          {section === "history" && (
            <>
              {/* Show "Book Again" ONLY for cancelled or noshow */}
              {(appointment.status === "cancelled" ||
                appointment.status === "noshow") && (
                <button
                  className="action-button book-again"
                  onClick={() => handleBookAgain(appointment)}
                >
                  Book Again
                </button>
              )}
              {/* Show "View Details" for completed appointments */}
              {appointment.status === "completed" && (
                <button
                  className="action-button view"
                  onClick={() => handleReschedule(appointment._id)} // Still goes to edit form for viewing
                >
                  View Details
                </button>
              )}
              {/* Optional: Add a fallback for other unexpected history statuses if needed */}
            </>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render ---
  if (loading && allAppointments.length === 0) {
    return <div className="loading">Loading your appointments...</div>;
  }
  if (error) {
    return <div className="message error">{error}</div>;
  }
  if (!token || !user || user.role !== "patient") {
    return (
      <div className="message error">
        Please log in as a patient to view appointments.
      </div>
    );
  }

  const anyFiltersActive =
    filterDoctor || filterStatus || filterStartDate || filterEndDate;
  const totalAppointments = Object.values(categorizedAppointments).reduce(
    (sum, cat) => sum + cat.length,
    0
  );

  return (
    <div className="appointment-list">
      <h1>My Appointments</h1>

      {/* Filters */}
      <div className="controls-container filter-controls">
        <div className="filter-group">
          <label htmlFor="filterDoctor">Doctor:</label>
          <select
            id="filterDoctor"
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
          >
            <option value="">All Doctors</option>
            {doctorsList.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name} ({doc.specialization})
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filterStatus">Status:</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="noshow">No Show</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filterStartDate">Date From:</label>
          <input
            type="date"
            id="filterStartDate"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="filterEndDate">Date To:</label>
          <input
            type="date"
            id="filterEndDate"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            max={formatDateForInput(new Date())}
          />
        </div>
      </div>

      {/* --- Render Sections --- */}
      {loading && (
        <div className="loading" style={{ marginTop: "20px" }}>
          Refreshing...
        </div>
      )}

      {totalAppointments === 0 && !loading && (
        <p style={{ marginTop: "20px", textAlign: "center" }}>
          {anyFiltersActive
            ? "No appointments match the current filters."
            : "You have no appointments scheduled yet."}
        </p>
      )}

      {!anyFiltersActive && totalAppointments === 0 && !loading && (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button
            onClick={() => navigate("/add")}
            className="cta-button primary"
          >
            Book New Appointment
          </button>
        </div>
      )}

      {categorizedAppointments.today.length > 0 && (
        <section>
          <h2>Today</h2>
          <div className="appointment-cards">
            {categorizedAppointments.today.map((apt) =>
              renderAppointmentCard(apt, "today")
            )}
          </div>
        </section>
      )}

      {categorizedAppointments.pendingUpdate.length > 0 && (
        <section>
          <h2>Pending Update</h2>
          <div className="appointment-cards">
            {categorizedAppointments.pendingUpdate.map((apt) =>
              renderAppointmentCard(apt, "pendingUpdate")
            )}
          </div>
        </section>
      )}

      {categorizedAppointments.upcoming.length > 0 && (
        <section>
          <h2>Upcoming</h2>
          <div className="appointment-cards">
            {categorizedAppointments.upcoming.map((apt) =>
              renderAppointmentCard(apt, "upcoming")
            )}
          </div>
        </section>
      )}

      {categorizedAppointments.history.length > 0 && (
        <section>
          <h2>History</h2>
          <div className="appointment-cards">
            {categorizedAppointments.history.map((apt) =>
              renderAppointmentCard(apt, "history")
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AppointmentList;
