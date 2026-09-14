import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import AuthContext from "../../context/AuthContext";
import {
  CalendarCheck,
  Funnel,
  Clock,
  User,
  Stethoscope,
  PencilSimple,
  XCircle,
  Trash,
  FloppyDisk,
  X,
  ArrowCounterClockwise,
  WarningCircle,
} from "@phosphor-icons/react";

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
      return (
        <div className="loading status-message min-h-[40vh] flex items-center justify-center text-sm text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
          Loading appointments...
        </div>
      );
    }
    if (error) {
      return (
        <div className="error-message status-message p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <WarningCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      );
    }
    if (!Array.isArray(appointments)) {
      return (
        <div className="error-message status-message p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
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
        <div className="info-message status-message bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 text-sm">
          {filtersApplied
            ? "No appointments found matching the current filter criteria."
            : "There are currently no appointments in the system."}
        </div>
      );
    }

    return (
      <div className="appointments-table-container bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden relative">
        {isLoading && (
          <div className="loading-overlay absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10 text-xs font-semibold text-teal-700 dark:text-teal-300">
            Updating schedules...
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="appointments-table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Date</th>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Physician</th>
                <th className="py-3.5 px-4">Consultation Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-800 dark:text-slate-200">
              {appointments.map((appt) => {
                const statusStyles = {
                  scheduled: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60",
                  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
                  cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60",
                  noshow: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
                }[appt.status?.toLowerCase()] || "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";

                return (
                  <tr
                    key={appt._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Date */}
                    <td data-label="Date" className="py-4 px-4 sm:px-6 font-mono font-medium text-slate-900 dark:text-white">
                      {formatDateForInput(appt.appointmentDate)}
                    </td>

                    {/* Time */}
                    <td data-label="Time" className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {appt.startTime} - {appt.endTime}
                      </span>
                    </td>

                    {/* Patient */}
                    <td data-label="Patient" className="py-4 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {appt.patientUserId?.name || "N/A"}
                      </div>
                      <span className="patient-email text-[11px] font-mono text-slate-400 block">
                        {appt.patientUserId?.email || "N/A"}
                      </span>
                    </td>

                    {/* Doctor */}
                    <td data-label="Doctor" className="py-4 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {appt.doctorId?.name || "N/A"}
                      </div>
                      <span className="doctor-specialty text-[11px] text-teal-600 dark:text-teal-400 block font-medium">
                        {appt.doctorId?.specialization || "General"}
                      </span>
                    </td>

                    {/* Reason */}
                    <td data-label="Reason" title={appt.reason} className="py-4 px-4 max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                      {appt.reason || "Routine Consultation"}
                    </td>

                    {/* Status */}
                    <td data-label="Status" className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles}`}>
                        {appt.status ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1) : "Scheduled"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td data-label="Actions" className="action-buttons-cell py-4 px-4 sm:px-6 text-right">
                      <div className="action-buttons inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(appt)}
                          className="btn btn-edit px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                          title="Edit Appointment"
                          disabled={isLoading}
                        >
                          <PencilSimple className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {appt.status === "scheduled" && (
                          <button
                            onClick={() => handleCancelAppointment(appt._id)}
                            className="btn btn-cancel px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 rounded-lg text-xs font-medium transition-colors"
                            title="Cancel Appointment"
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAppointment(appt._id)}
                          className="btn btn-delete px-2 py-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium transition-colors"
                          title="Delete Appointment"
                          disabled={isLoading}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- Main Component Return ---
  return (
    <div className="appointment-oversight-container w-full max-w-[1650px] mx-auto py-8 sm:py-10 px-4 sm:px-8 lg:px-12 space-y-8 animate-materialize">
      {/* Header Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              Global Appointment Oversight
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Auditing, rescheduling, and comprehensive operational monitoring across all clinic appointments.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
          <span>Active Bookings:</span>
          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
            {appointments.length}
          </span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-heading font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Funnel className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Filter & Search Consultations
          </h3>

          <div className="filter-actions">
            <button
              onClick={clearFilters}
              className="btn btn-secondary px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              <ArrowCounterClockwise className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="filter-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Patient Filter */}
          <div className="filter-item">
            <label
              htmlFor="patientId"
              className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Patient:
            </label>
            <select
              id="patientId"
              name="patientId"
              value={filters.patientId}
              onChange={handleFilterChange}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
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
            <label
              htmlFor="doctorId"
              className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Doctor:
            </label>
            <select
              id="doctorId"
              name="doctorId"
              value={filters.doctorId}
              onChange={handleFilterChange}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.specialization || "N/A"})
                </option>
              ))}
            </select>
          </div>

          {/* Date Start Filter */}
          <div className="filter-item">
            <label
              htmlFor="dateStart"
              className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Date From:
            </label>
            <input
              type="date"
              id="dateStart"
              name="dateStart"
              value={filters.dateStart}
              onChange={handleFilterChange}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Date End Filter */}
          <div className="filter-item">
            <label
              htmlFor="dateEnd"
              className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Date To:
            </label>
            <input
              type="date"
              id="dateEnd"
              name="dateEnd"
              value={filters.dateEnd}
              onChange={handleFilterChange}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="filter-item">
            <label
              htmlFor="status"
              className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              Status:
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="noshow">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Content Area: Shows Loading, Error, No Data, or Table */}
      <div className="content-area">{renderContent()}</div>

      {/* Edit Modal */}
      {editingAppointment && (
        <div className="modal-overlay fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-materialize space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-heading font-semibold text-slate-900 dark:text-white">
                Edit Consultation Details
              </h3>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAppointment} className="space-y-4">
              {/* Date Input */}
              <div className="form-group">
                <label
                  htmlFor="editApptDate"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Appointment Date:
                </label>
                <input
                  type="date"
                  id="editApptDate"
                  name="appointmentDate"
                  value={editFormData.appointmentDate}
                  onChange={handleEditFormChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Start Time Input */}
              <div className="form-group">
                <label
                  htmlFor="editStartTime"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Start Time (HH:MM):
                </label>
                <input
                  type="time"
                  id="editStartTime"
                  name="startTime"
                  value={editFormData.startTime}
                  onChange={handleEditFormChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Status Select */}
              <div className="form-group">
                <label
                  htmlFor="editStatus"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Status:
                </label>
                <select
                  id="editStatus"
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditFormChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="noshow">No Show</option>
                </select>
              </div>

              {/* Reason Textarea */}
              <div className="form-group">
                <label
                  htmlFor="editReason"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Reason for Visit:
                </label>
                <textarea
                  id="editReason"
                  name="reason"
                  value={editFormData.reason}
                  onChange={handleEditFormChange}
                  rows="2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                ></textarea>
              </div>

              {/* Remarks Textarea */}
              <div className="form-group">
                <label
                  htmlFor="editRemarks"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Clinical Remarks / Doctor Notes:
                </label>
                <textarea
                  id="editRemarks"
                  name="remarks"
                  value={editFormData.remarks}
                  onChange={handleEditFormChange}
                  rows="2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                ></textarea>
              </div>

              {/* Patient Phone Input */}
              <div className="form-group">
                <label
                  htmlFor="editPatientPhone"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Patient Phone:
                </label>
                <input
                  type="tel"
                  id="editPatientPhone"
                  name="patientPhone"
                  value={editFormData.patientPhone}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="modal-actions flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-cancel px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-save px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors btn-press cursor-pointer"
                >
                  <FloppyDisk className="w-4 h-4" />
                  Save Changes
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
