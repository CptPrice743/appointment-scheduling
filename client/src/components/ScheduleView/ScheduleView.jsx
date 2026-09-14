import React, { useState, useEffect, useContext, useMemo } from "react";
import AuthContext from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Clock,
  User,
  Funnel,
  ArrowCounterClockwise,
  PencilSimple,
  XCircle,
  CheckCircle,
  WarningCircle,
  Eye,
  EnvelopeSimple,
  Phone,
} from "@phosphor-icons/react";

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const displayOptions = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, displayOptions);
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

const ScheduleView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, user, axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();

  // Filter States
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
      setAppointments([]);
      setLoading(false);
    }
  }, [token, user]);

  // Filter, Categorize and Sort
  const categorizedAppointments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let filtered = appointments.filter((apt) => {
      const aptDateTime = getAppointmentDateTime(apt);
      if (isNaN(aptDateTime?.getTime())) {
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
        ? aptDateOnly >= new Date(filterStartDate + "T00:00:00Z")
        : true;
      const endDateMatch = filterEndDate
        ? aptDateOnly <= new Date(filterEndDate + "T00:00:00Z")
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
    appointments,
    filterPatientName,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);

  const handleViewEdit = (appointmentId) => {
    navigate(`/edit/${appointmentId}`);
  };

  const handleCancelByDoctor = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      setError("");
      setLoading(true);
      try {
        await axiosInstance.patch(`/appointments/${appointmentId}`, {
          status: "cancelled",
        });
        await fetchDoctorSchedule();
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        setError(
          err.response?.data?.message || "Failed to cancel appointment."
        );
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status, isPending) => {
    if (isPending) {
      return (
        <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
          <Clock size={12} weight="bold" />
          Pending Outcome
        </span>
      );
    }
    switch (status?.toLowerCase()) {
      case "scheduled":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Scheduled
          </span>
        );
      case "completed":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle size={12} weight="bold" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
            <XCircle size={12} weight="bold" />
            Cancelled
          </span>
        );
      case "noshow":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 flex items-center gap-1.5">
            <WarningCircle size={12} weight="bold" />
            No Show
          </span>
        );
      default:
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  const renderScheduleCard = (appointment, section) => {
    if (!appointment || !appointment._id) return null;
    const isPastScheduled =
      section === "pendingUpdate" && appointment.status === "scheduled";
    const patientName =
      appointment.patientUserId?.name ||
      appointment.patientName ||
      "Patient";
    const patientEmail =
      appointment.patientUserId?.email || appointment.patientEmail || "";
    const patientPhone =
      appointment.patientUserId?.phone || appointment.patientPhone || "";

    return (
      <div key={appointment._id} className="doppelrand-shell">
        <div className="doppelrand-core p-5 sm:p-6 flex flex-col justify-between h-full">
          <div className="specular-hairline" />

          {/* Card Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm font-display">
                {patientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display text-sm sm:text-base font-bold text-zinc-950 dark:text-white leading-snug">
                  {patientName}
                </h3>
                {patientEmail && (
                  <p className="text-xs text-zinc-400 flex items-center gap-1 font-mono-code">
                    <EnvelopeSimple size={12} />
                    <span className="truncate max-w-[180px]">{patientEmail}</span>
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge(appointment.status, isPastScheduled)}
          </div>

          {/* Telemetry Strip */}
          <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.05] grid grid-cols-2 gap-2 my-2 text-xs font-mono-code">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Visit Date</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {formatDate(appointment.appointmentDate)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Time Window</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {formatTime12Hour(appointment.startTime)} <span className="text-zinc-400 font-normal">({appointment.duration}m)</span>
              </span>
            </div>
          </div>

          {/* Clinical Reason */}
          <div className="mt-2.5 mb-3">
            <span className="text-[10px] uppercase font-mono-code tracking-wider text-zinc-400 block mb-0.5">
              Stated Symptoms / Purpose
            </span>
            <p className="font-body text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {appointment.reason || "General Medical Consultation"}
            </p>
          </div>

          {/* Remarks */}
          {appointment.remarks && (
            <div className="mt-2 p-3 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] text-xs">
              <span className="font-mono-code font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                Clinical Remarks
              </span>
              <p className="text-zinc-800 dark:text-zinc-200 font-body leading-relaxed">
                {appointment.remarks}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-white/[0.06] flex flex-wrap items-center justify-end gap-2.5">
            {section !== "history" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleViewEdit(appointment._id)}
                  className="h-8.5 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold leading-none shadow-xs active:scale-[0.96] transition-all cursor-pointer"
                >
                  <PencilSimple size={14} />
                  <span>Update Record</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelByDoctor(appointment._id)}
                  className="h-8.5 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-none active:scale-[0.96] transition-all cursor-pointer"
                >
                  <XCircle size={14} />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleViewEdit(appointment._id)}
                className="h-8.5 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-semibold leading-none active:scale-[0.96] transition-all cursor-pointer"
              >
                <Eye size={14} />
                <span>View Record</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="py-20 text-center font-mono-code text-xs text-zinc-500">
        <div className="inline-block w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p>Loading clinical consultation schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono-code font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Schedule Filters Bar */}
      <div className="doppelrand-shell">
        <div className="doppelrand-core p-5">
          <div className="specular-hairline" />
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-3">
            <Funnel size={14} />
            <span>Filter Practice Schedule</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label htmlFor="filterPatientName" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                Patient Name
              </label>
              <input
                type="text"
                id="filterPatientName"
                value={filterPatientName}
                onChange={(e) => setFilterPatientName(e.target.value)}
                placeholder="Search patient..."
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="filterStatus" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                Status
              </label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="noshow">No Show</option>
              </select>
            </div>

            <div>
              <label htmlFor="filterStartDate" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                From Date
              </label>
              <input
                type="date"
                id="filterStartDate"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="filterEndDate" className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code mb-1">
                To Date
              </label>
              <input
                type="date"
                id="filterEndDate"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] active:scale-[0.96] transition-all cursor-pointer"
              >
                <ArrowCounterClockwise size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Sections */}
      <div className="space-y-10">
        {/* Today's Consultations */}
        {categorizedAppointments.today.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-display text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                Today's Consultations
              </h2>
              <span className="font-mono-code text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                {categorizedAppointments.today.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {categorizedAppointments.today.map((apt) =>
                renderScheduleCard(apt, "today")
              )}
            </div>
          </section>
        )}

        {/* Upcoming Consultations */}
        {categorizedAppointments.upcoming.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-display text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                Upcoming Schedule
              </h2>
              <span className="font-mono-code text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold">
                {categorizedAppointments.upcoming.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {categorizedAppointments.upcoming.map((apt) =>
                renderScheduleCard(apt, "upcoming")
              )}
            </div>
          </section>
        )}

        {/* Pending Updates */}
        {categorizedAppointments.pendingUpdate.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-display text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                Pending Outcome Updates
              </h2>
              <span className="font-mono-code text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                {categorizedAppointments.pendingUpdate.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {categorizedAppointments.pendingUpdate.map((apt) =>
                renderScheduleCard(apt, "pendingUpdate")
              )}
            </div>
          </section>
        )}

        {/* History */}
        {categorizedAppointments.history.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-display text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                Past Consultations Archive
              </h2>
              <span className="font-mono-code text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                {categorizedAppointments.history.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {categorizedAppointments.history.map((apt) =>
                renderScheduleCard(apt, "history")
              )}
            </div>
          </section>
        )}

        {/* Empty */}
        {categorizedAppointments.today.length === 0 &&
          categorizedAppointments.upcoming.length === 0 &&
          categorizedAppointments.pendingUpdate.length === 0 &&
          categorizedAppointments.history.length === 0 && (
            <div className="doppelrand-shell">
              <div className="doppelrand-core p-12 text-center">
                <div className="specular-hairline" />
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4">
                  <CalendarCheck size={26} />
                </div>
                <h3 className="font-display text-base font-bold text-zinc-950 dark:text-white mb-1">
                  No Consultations Scheduled
                </h3>
                <p className="font-body text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  No patient bookings match your active practice schedule filters.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ScheduleView;
