import React, { useState, useEffect, useContext, useMemo } from "react";
import AuthContext from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./ScheduleView.css";

// --- Helper Functions ---
const formatDate = (dateString) => {
  // Format YYYY-MM-DD for date input value, or readable format for display
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    // Format for display:
    const displayOptions = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, displayOptions);
  } catch (e) {
    return "Invalid Date";
  }
};

const formatDateForInput = (dateString) => {
  // Format YYYY-MM-DD specifically for date input
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Return empty if invalid
    // Use UTC methods to avoid timezone shifts when extracting parts
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting date for input:", e);
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
    dateTimeResult.setUTCHours(hours, minutes, 0, 0); // Use UTC to avoid TZ issues
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
const ScheduleView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, user, axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Filter States ---
  const [filterPatientName, setFilterPatientName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const handleResetFilters = () => {
    setFilterPatientName("");
    setFilterStatus("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const fetchDoctorSchedule = async () => {
    if (!user?.doctorProfile?._id) {
      setError("Doctor profile not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/doctors/appointments/my-schedule");
      console.log("Fetched doctor schedule:", res.data);
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Error fetching doctor's schedule:", err);
      setError(err.response?.data?.message || "Failed to load schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "doctor") {
      fetchDoctorSchedule();
    } else if (user?.role && user.role !== "doctor") {
      setError("Not authorized. This view is for doctors.");
      setLoading(false);
    } else {
      setAppointments([]); // Clear appointments if not doctor/logged in
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  // Filter, Categorize and Sort Appointments
  const categorizedAppointments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Apply filters first
    let filtered = appointments.filter((apt) => {
      const aptDateTime = getAppointmentDateTime(apt);
      if (isNaN(aptDateTime?.getTime())) {
        // Include invalid dates if no date filter applied, otherwise exclude
        return !filterStartDate && !filterEndDate;
      }
      const aptDateOnly = new Date(aptDateTime);
      aptDateOnly.setHours(0, 0, 0, 0);

      const patientNameLower = (
        apt.patientUserId?.name ||
        apt.patientName ||
        ""
      ).toLowerCase();
      const filterNameLower = filterPatientName.toLowerCase();

      const nameMatch = filterNameLower
        ? patientNameLower.includes(filterNameLower)
        : true;
      const statusMatch = filterStatus ? apt.status === filterStatus : true;
      const startDateMatch = filterStartDate
        ? aptDateOnly >= new Date(filterStartDate + "T00:00:00Z") // Compare using dates
        : true;
      const endDateMatch = filterEndDate
        ? aptDateOnly <= new Date(filterEndDate + "T00:00:00Z") // Compare using dates
        : true;

      return nameMatch && statusMatch && startDateMatch && endDateMatch;
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
        categories.history.push(apt); // Put invalid dates in history
        return;
      }

      const aptDateOnly = new Date(aptDateTime);
      aptDateOnly.setHours(0, 0, 0, 0); // Use local time for comparison against todayStart

      if (apt.status === "scheduled") {
        if (isToday(aptDateOnly)) {
          if (aptDateTime >= now) {
            categories.today.push(apt);
          } else {
            categories.pendingUpdate.push(apt); // Scheduled today, but time passed
          }
        } else if (aptDateTime > now) {
          categories.upcoming.push(apt);
        } else {
          categories.pendingUpdate.push(apt); // Scheduled in the past
        }
      } else {
        categories.history.push(apt); // Completed, Cancelled, NoShow
      }
    });

    // Sort sections
    categories.today.sort(
      (a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b)
    ); // Asc
    categories.upcoming.sort(
      (a, b) => getAppointmentDateTime(a) - getAppointmentDateTime(b)
    ); // Asc
    categories.pendingUpdate.sort(
      (a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a)
    ); // Desc
    categories.history.sort(
      (a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a)
    ); // Desc

    return categories;
  }, [
    appointments,
    filterPatientName,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);

  // --- Action Handlers ---
  const handleViewEdit = (appointmentId) => {
    navigate(`/edit/${appointmentId}`); // Navigate to the form for editing/completing
  };

  const handleCancelByDoctor = async (appointmentId) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this patient's appointment?"
      )
    ) {
      setLoading(true);
      setError("");
      try {
        await axiosInstance.patch(`/appointments/${appointmentId}`, {
          status: "cancelled",
        });
        await fetchDoctorSchedule(); // Refresh schedule
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        setError(
          err.response?.data?.message || "Failed to cancel appointment."
        );
        setLoading(false); // Ensure loading is off on error
      }
    }
  };

  // --- Render Logic ---
  const renderCard = (apt, section) => {
    if (!apt || !apt._id) {
      console.warn(
        "Attempted to render invalid appointment card in ScheduleView",
        apt
      );
      return null;
    }

    const isPastScheduled =
      section === "pendingUpdate" && apt.status === "scheduled";

    // Status display text
    let displayStatus = apt.status
      ? apt.status.charAt(0).toUpperCase() + apt.status.slice(1)
      : "Unknown";
    if (displayStatus === "Noshow") displayStatus = "No Show";
    if (isPastScheduled) displayStatus = "Pending"; // Override for Pending section

    // Badge class
    let badgeClass = `status-${apt.status}`;
    if (isPastScheduled) badgeClass = "status-pending";

    return (
      <div key={apt._id} className="appointment-card">
        {/* *** Card Header Wrapper Added *** */}
        <div className="card-header">
          <h3>
            Patient: {apt.patientUserId?.name || apt.patientName || "N/A"}
          </h3>
          <span className={`status-badge ${badgeClass}`}>{displayStatus}</span>
        </div>

        {/* Rest of the card content */}
        {apt.patientUserId?.email && (
          <p>
            <strong>Email:</strong> {apt.patientUserId.email}
          </p>
        )}
        <p>
          <strong>Date:</strong> {formatDate(apt.appointmentDate)}
        </p>
        <p>
          <strong>Time:</strong> {formatTime12Hour(apt.startTime)} -{" "}
          {formatTime12Hour(apt.endTime)} ({apt.duration} mins)
        </p>
        <p>
          <strong>Reason:</strong> {apt.reason}
        </p>
        {apt.remarks && (
          <p className="remarks">
            <strong>Remarks:</strong> {apt.remarks}
          </p>
        )}
        {/* Action Buttons */}
        <div className="appointment-actions">
          {(section === "today" || section === "pendingUpdate") && (
            <>
              <button
                className="action-button edit"
                onClick={() => handleViewEdit(apt._id)}
              >
                Complete / Edit
              </button>
              <button
                className="action-button cancel"
                onClick={() => handleCancelByDoctor(apt._id)}
              >
                Cancel
              </button>
            </>
          )}
          {section === "upcoming" && (
            <>
              <button
                className="action-button view" // Changed to view as per previous discussion
                onClick={() => handleViewEdit(apt._id)}
              >
                View / Edit
              </button>
              <button
                className="action-button cancel"
                onClick={() => handleCancelByDoctor(apt._id)}
              >
                Cancel
              </button>
            </>
          )}
          {section === "history" && (
            <button
              className="action-button view"
              onClick={() => handleViewEdit(apt._id)}
            >
              View Details
            </button>
          )}
        </div>
      </div>
    );
  };

  // --- Main Component Render ---
  if (loading && appointments.length === 0)
    return <div className="loading">Loading schedule...</div>;
  if (error) return <div className="message error">{error}</div>;
  if (user?.role !== "doctor") {
    return <div className="message error">This view is for doctors.</div>;
  }

  const totalAppointments = Object.values(categorizedAppointments).reduce(
    (sum, cat) => sum + cat.length,
    0
  );
  const anyFiltersActive =
    filterPatientName || filterStatus || filterStartDate || filterEndDate;

  return (
    <div className="schedule-view">
      {/* Filters */}
      <div className="controls-container filter-controls">
        <div className="filter-group">
          <label htmlFor="filterPatientName">Patient Name:</label>
          <input
            type="text"
            id="filterPatientName"
            value={filterPatientName}
            onChange={(e) => setFilterPatientName(e.target.value)}
            placeholder="Search by patient name..."
          />
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
          />
        </div>
        <div className="filter-group filter-action-group">
          {" "}
          {/* Optional: Group button */}
          <label>&nbsp;</label> {/* Align with other labels */}
          <button onClick={handleResetFilters} className="btn btn-reset">
            Reset Filters
          </button>
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
            : "No appointments found in your schedule."}
        </p>
      )}

      {categorizedAppointments.today.length > 0 && (
        <section>
          <h3>Today</h3>
          <div className="appointment-cards">
            {categorizedAppointments.today.map((apt) =>
              renderCard(apt, "today")
            )}
          </div>
        </section>
      )}

      {categorizedAppointments.pendingUpdate.length > 0 && (
        <section>
          <h3>Pending Update</h3>
          <div className="appointment-cards">
            {categorizedAppointments.pendingUpdate.map((apt) =>
              renderCard(apt, "pendingUpdate")
            )}
          </div>
        </section>
      )}

      {categorizedAppointments.upcoming.length > 0 && (
        <section>
          <h3>Upcoming</h3>
          <div className="appointment-cards">
            {categorizedAppointments.upcoming.map((apt) =>
              renderCard(apt, "upcoming")
            )}
          </div>
        </section>
      )}

      {categorizedAppointments.history.length > 0 && (
        <section>
          <h3>History</h3>
          <div className="appointment-cards">
            {categorizedAppointments.history.map((apt) =>
              renderCard(apt, "history")
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default ScheduleView;
