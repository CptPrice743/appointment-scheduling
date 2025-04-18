// client/src/pages/admin/AppointmentOversight.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import AuthContext from "../../context/AuthContext"; // Adjust path if needed
import "./AppointmentOversight.css"; // Ensure CSS file exists

// Helper to format date as YYYY-MM-DD, adjusting for timezone
const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    // Adjust for timezone offset to get the correct local date string
    const timezoneOffset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().split("T")[0];
  } catch (e) {
    console.error("Error formatting date:", e);
    return "";
  }
};

const AppointmentOversight = () => {
  const [appointments, setAppointments] = useState([]); // Holds the currently displayed list based on filters
  const [doctors, setDoctors] = useState([]); // For filter dropdown
  const [patients, setPatients] = useState([]); // For filter dropdown
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [error, setError] = useState(null); // To hold error messages
  const [editingAppointment, setEditingAppointment] = useState(null); // Track appointment being edited

  // State for filter values
  const [filters, setFilters] = useState({
    patientId: "",
    doctorId: "",
    dateStart: "",
    dateEnd: "",
    status: "",
  });

  const { token } = useContext(AuthContext); // Get auth token
  // Define the base API URL, using environment variable or fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Fetch data based on current filters
  const fetchData = useCallback(async () => {
    setIsLoading(true); // Set loading true for every fetch attempt
    // Don't clear error immediately, only on success
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }; // Auth header

      // Build query string from filter state
      const queryParams = new URLSearchParams();
      if (filters.patientId) queryParams.append("patientId", filters.patientId);
      if (filters.doctorId) queryParams.append("doctorId", filters.doctorId);
      if (filters.dateStart) queryParams.append("dateStart", filters.dateStart);
      if (filters.dateEnd) queryParams.append("dateEnd", filters.dateEnd);
      if (filters.status) queryParams.append("status", filters.status);

      // Fetch appointments based on filters
      const appointmentsRes = await axios.get(
        `${API_URL}/admin/appointments/all?${queryParams.toString()}`,
        config
      );

      // Validate API response for appointments
      if (Array.isArray(appointmentsRes.data)) {
        setAppointments(appointmentsRes.data);
        setError(null); // Clear previous errors on successful fetch
      } else {
        console.error(
          "API did not return an array for appointments:",
          appointmentsRes.data
        );
        setAppointments([]); // Reset appointments if data is invalid
        setError("Received unexpected data format from server."); // Set specific error
      }

      // Fetch doctors and patients list for filters, only if they haven't been fetched yet
      // Optimization: Check if doctors or patients arrays are empty before fetching
      if (doctors.length === 0) {
        const doctorsRes = await axios.get(`${API_URL}/admin/doctors`, config);
        if (Array.isArray(doctorsRes.data)) {
          setDoctors(doctorsRes.data);
        } else {
          console.error(
            "API did not return an array for doctors:",
            doctorsRes.data
          );
        }
      }
      if (patients.length === 0) {
        const usersRes = await axios.get(`${API_URL}/admin/users`, config);
        if (Array.isArray(usersRes.data)) {
          setPatients(usersRes.data.filter((user) => user.role === "patient"));
        } else {
          console.error(
            "API did not return an array for users:",
            usersRes.data
          );
        }
      }
    } catch (err) {
      console.error("Error fetching oversight data:", err);
      // Set specific error messages based on error type
      if (err.code === "ERR_NETWORK") {
        setError(
          "Connection failed. Please ensure the server is running and accessible."
        );
      } else if (err.response) {
        // Use server's error message if available
        setError(
          `Failed to fetch data: ${err.response.data.message || err.message}`
        );
      } else {
        setError("An unexpected error occurred while fetching data.");
      }
      setAppointments([]); // Clear appointment data on error
    } finally {
      setIsLoading(false); // Set loading false after fetch attempt completes
    }
    // Dependencies for useCallback: ensures function is re-created if these change
  }, [token, API_URL, filters, doctors.length, patients.length]); // Added lengths to dependencies

  // Effect to run initial data fetch when component mounts and token is available
  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      setError("Authentication token not found.");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Run only when token changes (effectively once on login)

  // Trigger refetch when filters change
  useEffect(() => {
    // Optional: Add debounce here if needed to avoid rapid firing on date changes
    if (token) {
      // Ensure token exists before fetching on filter change
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token]); // Refetch when filters change

  // Handler for changes in filter inputs
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for applying filters button (Now just confirms current filters, fetch happens via useEffect)
  const applyFilters = () => {
    // Optional: Could add visual feedback here, but fetch is automatic
    console.log("Applying filters:", filters);
  };

  // Handler for clearing filters button
  const clearFilters = () => {
    setFilters({
      // Reset state, which triggers useEffect -> fetchData
      patientId: "",
      doctorId: "",
      dateStart: "",
      dateEnd: "",
      status: "",
    });
  };

  // --- Edit Modal Logic ---
  const [editFormData, setEditFormData] = useState({}); // State for edit form data

  // Set up edit form when edit button is clicked
  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment); // Store the appointment being edited
    // Pre-fill form data
    setEditFormData({
      appointmentDate: formatDateForInput(appointment.appointmentDate),
      startTime: appointment.startTime,
      status: appointment.status,
      reason: appointment.reason || "",
      remarks: appointment.remarks || "",
      patientPhone: appointment.patientPhone || "",
      // Include endTime and duration if they are part of the Appointment model and editable
      // endTime: appointment.endTime,
      // duration: appointment.duration,
    });
  };

  // Update edit form state on input change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle submission of the edit form
  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    if (!editingAppointment) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      // Send only the editable fields from the form state
      const updatePayload = { ...editFormData };
      const response = await axios.put(
        `${API_URL}/admin/appointments/${editingAppointment._id}`, // Correct API endpoint
        updatePayload,
        config
      );

      // Update appointments list in state with the updated appointment
      const updatedAppt = response.data.appointment;
      setAppointments((prev) =>
        prev.map((appt) => (appt._id === updatedAppt._id ? updatedAppt : appt))
      );

      setEditingAppointment(null); // Close the edit modal
      alert("Appointment updated successfully!");
    } catch (err) {
      console.error("Error updating appointment:", err);
      alert(err.response?.data?.message || "Failed to update appointment.");
    }
  };

  // Close the edit modal without saving
  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  // --- Delete Logic ---
  const handleDeleteAppointment = async (appointmentId) => {
    if (
      window.confirm(
        `ARE YOU SURE you want to DELETE appointment ${appointmentId}? This cannot be undone.`
      )
    ) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(
          `${API_URL}/admin/appointments/${appointmentId}`, // Correct API endpoint
          config
        );
        // Remove the deleted appointment from state
        setAppointments((prev) =>
          prev.filter((appt) => appt._id !== appointmentId)
        );
        alert(`Appointment ${appointmentId} deleted successfully.`);
      } catch (err) {
        console.error("Error deleting appointment:", err);
        alert(err.response?.data?.message || "Failed to delete appointment.");
      }
    }
  };

  // --- Cancel Logic (Set Status) ---
  const handleCancelAppointment = async (appointmentId) => {
    if (
      window.confirm(
        `ARE YOU SURE you want to CANCEL appointment ${appointmentId}?`
      )
    ) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };
        // Send request to update only the status field
        const response = await axios.put(
          `${API_URL}/admin/appointments/${appointmentId}`, // Correct API endpoint
          { status: "cancelled" }, // Payload to set status
          config
        );

        // Update the appointment list in state with the updated status
        const updatedAppt = response.data.appointment;
        setAppointments((prev) =>
          prev.map((appt) =>
            appt._id === updatedAppt._id ? updatedAppt : appt
          )
        );

        alert(`Appointment ${appointmentId} cancelled successfully.`);
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        alert(err.response?.data?.message || "Failed to cancel appointment.");
      }
    }
  };

  // --- Conditional Rendering Logic ---
  const renderContent = () => {
    if (isLoading && appointments.length === 0) {
      // Show loading only if no data is currently displayed
      return (
        <div className="loading status-message">Loading appointments...</div>
      );
    }
    if (error) {
      return <div className="error-message status-message">{error}</div>;
    }
    if (!Array.isArray(appointments)) {
      return (
        <div className="error-message status-message">
          Failed to load appointment data correctly.
        </div>
      );
    }
    if (appointments.length === 0) {
      const filtersApplied =
        filters.patientId ||
        filters.doctorId ||
        filters.dateStart ||
        filters.dateEnd ||
        filters.status;
      return (
        <div className="info-message status-message">
          {filtersApplied
            ? "No appointments found matching the current filter criteria."
            : "There are currently no appointments in the system."}
        </div>
      );
    }

    // Render table if data exists
    return (
      <div className="appointments-table-container">
        {isLoading && <div className="loading-overlay">Updating...</div>}{" "}
        {/* Show overlay during refetch */}
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt._id}>
                {/* Date */}
                <td data-label="Date">
                  {formatDateForInput(appt.appointmentDate)}
                </td>
                {/* Time */}
                <td data-label="Time">
                  {appt.startTime} - {appt.endTime}
                </td>
                {/* Patient */}
                <td data-label="Patient">
                  {appt.patientUserId?.name || "N/A"} <br />{" "}
                  {/* Use <br> for line break */}
                  <span className="patient-email">
                    ({appt.patientUserId?.email || "N/A"})
                  </span>
                </td>
                {/* Doctor */}
                <td data-label="Doctor">
                  {appt.doctorId?.name || "N/A"} <br />{" "}
                  {/* Use <br> for line break */}
                  <span className="doctor-specialty">
                    ({appt.doctorId?.specialization || "N/A"})
                  </span>
                </td>
                {/* Reason */}
                {/* <<< MODIFIED: Display full reason, remove substring */}
                <td data-label="Reason" title={appt.reason}>
                  {appt.reason || ""}
                </td>
                {/* Status */}
                <td data-label="Status">
                  {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                </td>
                {/* Actions */}
                <td data-label="Actions" className="action-buttons-cell">
                  {" "}
                  {/* Added class */}
                  <div className="action-buttons">
                    {" "}
                    {/* Wrapped buttons */}
                    <button
                      onClick={() => handleEditClick(appt)}
                      className="btn btn-edit"
                      title="Edit Appointment"
                      disabled={isLoading} // Disable buttons during load
                    >
                      Edit
                    </button>
                    {appt.status === "scheduled" && (
                      <button
                        onClick={() => handleCancelAppointment(appt._id)}
                        className="btn btn-cancel"
                        title="Cancel Appointment"
                        disabled={isLoading} // Disable buttons during load
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAppointment(appt._id)}
                      className="btn btn-delete"
                      title="Delete Appointment"
                      disabled={isLoading} // Disable buttons during load
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Main Component Return ---
  return (
    <div className="appointment-oversight-container">
      <h2>Appointment Oversight</h2>

      {/* Filter Section */}
      <div className="filter-section card">
        <h3>Filter Appointments</h3>
        <div className="filter-grid">
          {/* Patient Filter */}
          <div className="filter-item">
            <label htmlFor="patientId">Patient:</label>
            <select
              id="patientId"
              name="patientId"
              value={filters.patientId}
              onChange={handleFilterChange}
              disabled={isLoading} // Disable during load
            >
              <option value="">All Patients</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>
          {/* Doctor Filter */}
          <div className="filter-item">
            <label htmlFor="doctorId">Doctor:</label>
            <select
              id="doctorId"
              name="doctorId"
              value={filters.doctorId}
              onChange={handleFilterChange}
              disabled={isLoading} // Disable during load
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.specialization || "N/A"}){" "}
                  {/* Show specialization */}
                </option>
              ))}
            </select>
          </div>
          {/* Date Start Filter */}
          <div className="filter-item">
            <label htmlFor="dateStart">Date From:</label>
            <input
              type="date"
              id="dateStart"
              name="dateStart"
              value={filters.dateStart}
              onChange={handleFilterChange}
              disabled={isLoading} // Disable during load
            />
          </div>
          {/* Date End Filter */}
          <div className="filter-item">
            <label htmlFor="dateEnd">Date To:</label>
            <input
              type="date"
              id="dateEnd"
              name="dateEnd"
              value={filters.dateEnd}
              onChange={handleFilterChange}
              disabled={isLoading} // Disable during load
            />
          </div>
          {/* Status Filter */}
          <div className="filter-item">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              disabled={isLoading} // Disable during load
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="noshow">No Show</option>
            </select>
          </div>
        </div>
        {/* Filter Action Buttons */}
        <div className="filter-actions">
          {/* Apply Filters button might be redundant if useEffect handles it */}
          {/* <button onClick={applyFilters} className="btn btn-primary" disabled={isLoading}> Apply Filters </button> */}
          <button
            onClick={clearFilters}
            className="btn btn-secondary"
            disabled={isLoading} // Disable during load
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Dynamic Content Area: Shows Loading, Error, No Data, or Table */}
      <div className="content-area">{renderContent()}</div>

      {/* Edit Modal */}
      {editingAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Appointment ({editingAppointment._id})</h3>
            <form onSubmit={handleUpdateAppointment}>
              {/* Date Input */}
              <div className="form-group">
                <label htmlFor="editApptDate">Date:</label>
                <input
                  type="date"
                  id="editApptDate"
                  name="appointmentDate"
                  value={editFormData.appointmentDate}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              {/* Start Time Input */}
              <div className="form-group">
                <label htmlFor="editStartTime">Start Time (HH:MM):</label>
                <input
                  type="time"
                  id="editStartTime"
                  name="startTime"
                  value={editFormData.startTime}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              {/* Status Select */}
              <div className="form-group">
                <label htmlFor="editStatus">Status:</label>
                <select
                  id="editStatus"
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditFormChange}
                  required
                >
                  {/* Hardcoded options matching the schema */}
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="noshow">No Show</option>
                </select>
              </div>
              {/* Reason Textarea */}
              <div className="form-group">
                <label htmlFor="editReason">Reason:</label>
                <textarea
                  id="editReason"
                  name="reason"
                  value={editFormData.reason}
                  onChange={handleEditFormChange}
                  rows="2"
                ></textarea>
              </div>
              {/* Remarks Textarea */}
              <div className="form-group">
                <label htmlFor="editRemarks">Remarks (Doctor Notes):</label>
                <textarea
                  id="editRemarks"
                  name="remarks"
                  value={editFormData.remarks}
                  onChange={handleEditFormChange}
                  rows="2"
                ></textarea>
              </div>
              {/* Patient Phone Input */}
              <div className="form-group">
                <label htmlFor="editPatientPhone">Patient Phone:</label>
                <input
                  type="tel"
                  id="editPatientPhone"
                  name="patientPhone"
                  value={editFormData.patientPhone}
                  onChange={handleEditFormChange}
                />
              </div>
              {/* Modal Action Buttons */}
              <div className="modal-actions">
                <button type="submit" className="btn btn-save">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-cancel" // Use consistent grey cancel
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentOversight;
