import React, { useState, useEffect, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
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
  CheckCircle,
} from "@phosphor-icons/react";

const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().split("T")[0];
  } catch (e) {
    console.error("Error formatting date:", e);
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
    if (isNaN(date.getHours()) || isNaN(date.getMinutes())) return "Invalid Time";
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "Invalid Time";
  }
};

const AppointmentOversight = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [filters, setFilters] = useState({
    patientId: "",
    doctorId: "",
    dateStart: "",
    dateEnd: "",
    status: "",
  });

  const { token } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const queryParams = new URLSearchParams();
      if (filters.patientId) queryParams.append("patientId", filters.patientId);
      if (filters.doctorId) queryParams.append("doctorId", filters.doctorId);
      if (filters.dateStart) queryParams.append("dateStart", filters.dateStart);
      if (filters.dateEnd) queryParams.append("dateEnd", filters.dateEnd);
      if (filters.status) queryParams.append("status", filters.status);

      const appointmentsRes = await axios.get(
        `${API_URL}/admin/appointments/all?${queryParams.toString()}`,
        config
      );

      if (Array.isArray(appointmentsRes.data)) {
        setAppointments(appointmentsRes.data);
        setError(null);
      } else {
        console.error(
          "API did not return an array for appointments:",
          appointmentsRes.data
        );
        setAppointments([]);
        setError("Received unexpected data format from server.");
      }

      if (doctors.length === 0) {
        const doctorsRes = await axios.get(`${API_URL}/admin/doctors`, config);
        if (Array.isArray(doctorsRes.data)) {
          setDoctors(doctorsRes.data);
        }
      }
      if (patients.length === 0) {
        const usersRes = await axios.get(`${API_URL}/admin/users`, config);
        if (Array.isArray(usersRes.data)) {
          setPatients(usersRes.data.filter((user) => user.role === "patient"));
        }
      }
    } catch (err) {
      console.error("Error fetching oversight data:", err);
      if (err.code === "ERR_NETWORK") {
        setError(
          "Connection failed. Please ensure the server is running and accessible."
        );
      } else if (err.response) {
        setError(
          `Failed to fetch data: ${err.response.data.message || err.message}`
        );
      } else {
        setError("An unexpected error occurred while fetching data.");
      }
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL, filters, doctors.length, patients.length]);

  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      setError("Authentication token not found.");
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [filters, token]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      patientId: "",
      doctorId: "",
      dateStart: "",
      dateEnd: "",
      status: "",
    });
  };

  // Edit Modal
  const [editFormData, setEditFormData] = useState({});

  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment);
    setEditFormData({
      appointmentDate: formatDateForInput(appointment.appointmentDate),
      startTime: appointment.startTime,
      status: appointment.status,
      reason: appointment.reason || "",
      remarks: appointment.remarks || "",
      patientPhone: appointment.patientPhone || "",
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

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
      const updatePayload = { ...editFormData };
      const response = await axios.put(
        `${API_URL}/admin/appointments/${editingAppointment._id}`,
        updatePayload,
        config
      );

      const updatedAppt = response.data.appointment;
      setAppointments((prev) =>
        prev.map((appt) => (appt._id === updatedAppt._id ? updatedAppt : appt))
      );

      setEditingAppointment(null);
      alert("Appointment updated successfully!");
    } catch (err) {
      console.error("Error updating appointment:", err);
      alert(err.response?.data?.message || "Failed to update appointment.");
    }
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (
      window.confirm(
        `ARE YOU SURE you want to DELETE appointment ${appointmentId}? This cannot be undone.`
      )
    ) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(
          `${API_URL}/admin/appointments/${appointmentId}`,
          config
        );
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
        const response = await axios.put(
          `${API_URL}/admin/appointments/${appointmentId}`,
          { status: "cancelled" },
          config
        );

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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Scheduled
          </span>
        );
      case "completed":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
      case "noshow":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            No Show
          </span>
        );
      default:
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 animate-materialize space-y-8">
      {/* Header Area */}
      <div className="doppelrand-shell">
        <div className="doppelrand-core p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="specular-hairline" />
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <CalendarCheck size={24} className="text-sky-600 dark:text-sky-400" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 dark:text-white tracking-tight">
                Global Appointment Oversight
              </h1>
            </div>
            <p className="font-body text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Auditing, rescheduling, and comprehensive operational monitoring across all clinic appointments.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] text-xs font-mono-code text-zinc-600 dark:text-zinc-400 w-fit">
            <span>Active Bookings:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">
              {appointments.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Control Chassis */}
      <div className="doppelrand-shell">
        <div className="doppelrand-core p-5">
          <div className="specular-hairline" />
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-3 mb-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono-code">
              <Funnel size={14} />
              <span>Filter & Search Consultations</span>
            </div>

            <button
              onClick={clearFilters}
              className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] active:scale-[0.96] transition-all cursor-pointer"
              disabled={isLoading}
            >
              <ArrowCounterClockwise size={12} />
              <span>Clear Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Patient */}
            <div>
              <label htmlFor="patientId" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                Patient
              </label>
              <select
                id="patientId"
                name="patientId"
                value={filters.patientId}
                onChange={handleFilterChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              >
                <option value="">All Patients</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label htmlFor="doctorId" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                Doctor
              </label>
              <select
                id="doctorId"
                name="doctorId"
                value={filters.doctorId}
                onChange={handleFilterChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              >
                <option value="">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label htmlFor="dateStart" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                From Date
              </label>
              <input
                type="date"
                id="dateStart"
                name="dateStart"
                value={filters.dateStart}
                onChange={handleFilterChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              />
            </div>

            {/* To Date */}
            <div>
              <label htmlFor="dateEnd" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                To Date
              </label>
              <input
                type="date"
                id="dateEnd"
                name="dateEnd"
                value={filters.dateEnd}
                onChange={handleFilterChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
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
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono-code">
          {error}
        </div>
      )}

      {/* Content Rendering */}
      {isLoading && appointments.length === 0 ? (
        <div className="py-20 text-center font-mono-code text-xs text-zinc-500">
          <div className="inline-block w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Syncing oversight consultation database...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="doppelrand-shell">
          <div className="doppelrand-core p-12 text-center text-zinc-400 font-mono-code text-xs">
            No appointments found matching the selected filter criteria.
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View (md:hidden) */}
          <div className="md:hidden space-y-4">
            {appointments.map((appt) => (
              <div key={appt._id} className="doppelrand-shell">
                <div className="doppelrand-core p-5 space-y-4">
                  <div className="specular-hairline" />

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-sm font-bold text-zinc-950 dark:text-white">
                        {appt.patientUserId?.name || appt.patientName || "Patient"}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono-code">
                        {appt.patientUserId?.email || "No email on record"}
                      </p>
                    </div>
                    {getStatusBadge(appt.status)}
                  </div>

                  {/* Telemetry Strip */}
                  <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.05] grid grid-cols-2 gap-2 text-xs font-mono-code">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Doctor</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                        {appt.doctorId?.name || "Dr. Assigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Date & Time</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                        {formatDateForInput(appt.appointmentDate)} • {formatTime12Hour(appt.startTime)}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <span className="text-[10px] uppercase font-mono-code tracking-wider text-zinc-400 block mb-0.5">
                      Reason
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-body">
                      {appt.reason || "Routine Consultation"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(appt)}
                      className="h-8 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.96] transition-all cursor-pointer"
                    >
                      <PencilSimple size={14} />
                      <span>Edit</span>
                    </button>
                    {appt.status === "scheduled" && (
                      <button
                        onClick={() => handleCancelAppointment(appt._id)}
                        className="h-8 px-3 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold active:scale-[0.96] transition-all cursor-pointer"
                      >
                        <span>Cancel</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAppointment(appt._id)}
                      className="h-8 px-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center justify-center active:scale-[0.96] transition-all cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block doppelrand-shell">
            <div className="doppelrand-core p-0 overflow-hidden">
              <div className="specular-hairline" />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      <th className="py-4 px-6 font-semibold">Date</th>
                      <th className="py-4 px-4 font-semibold">Time</th>
                      <th className="py-4 px-4 font-semibold">Patient</th>
                      <th className="py-4 px-4 font-semibold">Physician</th>
                      <th className="py-4 px-4 font-semibold">Reason</th>
                      <th className="py-4 px-4 font-semibold">Status</th>
                      <th className="py-4 px-6 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05] text-xs font-body">
                    {appointments.map((appt) => (
                      <tr
                        key={appt._id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6 font-mono-code font-semibold text-zinc-950 dark:text-white">
                          {formatDateForInput(appt.appointmentDate)}
                        </td>

                        <td className="py-4 px-4 font-mono-code text-zinc-600 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} className="text-zinc-400" />
                            <span>{formatTime12Hour(appt.startTime)}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-semibold text-zinc-950 dark:text-white">
                            {appt.patientUserId?.name || appt.patientName || "N/A"}
                          </div>
                          <span className="text-[11px] font-mono-code text-zinc-400 block">
                            {appt.patientUserId?.email || "N/A"}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-semibold text-zinc-950 dark:text-white">
                            {appt.doctorId?.name || "N/A"}
                          </div>
                          <span className="text-[11px] text-sky-600 dark:text-sky-400 block font-medium">
                            {appt.doctorId?.specialization || "General"}
                          </span>
                        </td>

                        <td className="py-4 px-4 max-w-[200px] truncate text-zinc-600 dark:text-zinc-400">
                          {appt.reason || "Routine Consultation"}
                        </td>

                        <td className="py-4 px-4">
                          {getStatusBadge(appt.status)}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditClick(appt)}
                              className="h-8 px-2.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-semibold inline-flex items-center gap-1 active:scale-[0.96] transition-all cursor-pointer"
                              title="Edit Appointment"
                            >
                              <PencilSimple size={14} />
                              <span>Edit</span>
                            </button>
                            {appt.status === "scheduled" && (
                              <button
                                onClick={() => handleCancelAppointment(appt._id)}
                                className="h-8 px-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold active:scale-[0.96] transition-all cursor-pointer"
                                title="Cancel Appointment"
                              >
                                <span>Cancel</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAppointment(appt._id)}
                              className="h-8 px-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold active:scale-[0.96] transition-all cursor-pointer"
                              title="Delete Appointment"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingAppointment &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-materialize">
            <div className="w-full max-w-lg doppelrand-shell max-h-[90vh] overflow-y-auto">
            <div className="doppelrand-core p-6 sm:p-7">
              <div className="specular-hairline" />

              <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-100 dark:border-white/[0.06]">
                <h3 className="font-display font-semibold text-base text-zinc-950 dark:text-white flex items-center gap-2">
                  <PencilSimple size={18} className="text-sky-600 dark:text-sky-400" />
                  <span>Edit Appointment Record</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateAppointment} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.05] grid grid-cols-2 gap-2 text-xs font-mono-code mb-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Patient</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                      {editingAppointment.patientUserId?.name || editingAppointment.patientName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Doctor</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                      {editingAppointment.doctorId?.name || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="editApptDate"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                    >
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      id="editApptDate"
                      name="appointmentDate"
                      value={editFormData.appointmentDate}
                      onChange={handleEditFormChange}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="editStartTime"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="editStartTime"
                      name="startTime"
                      value={editFormData.startTime}
                      onChange={handleEditFormChange}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="editStatus"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Consultation Status
                  </label>
                  <select
                    id="editStatus"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none cursor-pointer"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="noshow">No Show</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="editReason"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Reason for Visit
                  </label>
                  <textarea
                    id="editReason"
                    name="reason"
                    value={editFormData.reason}
                    onChange={handleEditFormChange}
                    rows="2"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                  ></textarea>
                </div>

                <div>
                  <label
                    htmlFor="editRemarks"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Doctor Remarks / Clinical Notes
                  </label>
                  <textarea
                    id="editRemarks"
                    name="remarks"
                    value={editFormData.remarks}
                    onChange={handleEditFormChange}
                    rows="2"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                  ></textarea>
                </div>

                <div>
                  <label
                    htmlFor="editPatientPhone"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Patient Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="editPatientPhone"
                    name="patientPhone"
                    value={editFormData.patientPhone}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="h-9 px-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs active:scale-[0.97] transition-all cursor-pointer"
                  >
                    <FloppyDisk size={15} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AppointmentOversight;
