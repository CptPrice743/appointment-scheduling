import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import {
  CalendarBlank,
  Clock,
  User,
  Stethoscope,
  Phone,
  EnvelopeSimple,
  NotePencil,
  ArrowLeft,
  CheckCircle,
  SpinnerGap,
  ArrowUpRight,
} from "@phosphor-icons/react";

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

const AppointmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, axiosInstance } = useContext(AuthContext);

  const isEditing = !!id;
  const isDoctorView = user?.role === "doctor";
  const prefillData = location.state?.prefillData;

  const [formData, setFormData] = useState({
    appointmentDate: formatDateForInput(
      prefillData?.appointmentDate || new Date()
    ),
    startTime: prefillData?.startTime || "",
    reason: prefillData?.reason || "",
    status: "scheduled",
    remarks: "",
    patientUserId: "",
    patientName: isDoctorView ? "" : user?.name || "",
    patientEmail: isDoctorView ? "" : user?.email || "",
    patientPhone: isDoctorView ? "" : user?.phone || "",
    doctorId: prefillData?.doctorId || "",
    duration: "",
    _doctorName: "",
    _doctorSpecialization: "",
  });

  const [originalStartTime, setOriginalStartTime] = useState(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(!isEditing);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const allowTimeChange = !isEditing || formData.status === "scheduled";

  // Fetch list of doctors
  useEffect(() => {
    if (!isEditing && !isDoctorView) {
      setLoading(true);
      axiosInstance
        .get("/doctors/list")
        .then((res) => {
          setDoctors(res.data || []);
          if (prefillData?.doctorId) {
            const selectedDoc = (res.data || []).find(
              (doc) => doc._id === prefillData.doctorId
            );
            if (selectedDoc) {
              setFormData((prev) => ({
                ...prev,
                duration: selectedDoc.appointmentDuration,
              }));
            }
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching doctors:", err);
          setErrorMessage("Failed to load doctor list.");
          setLoading(false);
        });
    }
  }, [axiosInstance, isEditing, isDoctorView, prefillData?.doctorId]);

  // Fetch appointment data if editing
  useEffect(() => {
    if (isEditing && id) {
      axiosInstance
        .get(`/appointments/${id}`)
        .then((res) => {
          const {
            appointmentDate,
            doctorId,
            patientUserId,
            startTime,
            duration,
            patientPhone,
            patientName: fetchedPatientName,
            reason,
            status,
            remarks,
          } = res.data;

          const populatedDoctorId = doctorId?._id || doctorId || "";
          const fetchedDuration = duration || "";

          setFormData((prev) => ({
            ...prev,
            appointmentDate: formatDateForInput(appointmentDate),
            startTime: startTime || "",
            duration: fetchedDuration,
            doctorId: populatedDoctorId,
            patientUserId: patientUserId?._id || "",
            patientName: fetchedPatientName || patientUserId?.name || "",
            patientEmail: patientUserId?.email || "",
            patientPhone: patientPhone || "",
            reason: reason || "",
            status: status || "scheduled",
            remarks: remarks || "",
            _doctorName: doctorId?.name || "N/A",
            _doctorSpecialization: doctorId?.specialization || "N/A",
          }));
          setOriginalStartTime(startTime || null);

          if (populatedDoctorId) {
            axiosInstance
              .get(`/doctors/${populatedDoctorId}`)
              .then((docRes) => {
                if (docRes.data?.appointmentDuration) {
                  setFormData((prev) => ({
                    ...prev,
                    duration: docRes.data.appointmentDuration,
                  }));
                }
              })
              .catch((err) =>
                console.error("Could not fetch doctor details on edit load", err)
              )
              .finally(() => {
                setLoading(false);
                setInitialDataLoaded(true);
              });
          } else {
            setLoading(false);
            setInitialDataLoaded(true);
          }
        })
        .catch((err) => {
          console.error("Error fetching appointment:", err);
          setErrorMessage(
            err.response?.data?.message || "Failed to load appointment data."
          );
          setLoading(false);
          setInitialDataLoaded(true);
        });
    }
  }, [id, isEditing, axiosInstance]);

  // Fetch available slots
  const fetchAvailableSlots = useCallback(
    async (docId, date) => {
      if (!docId || !date || !allowTimeChange) {
        setAvailableSlots([]);
        return;
      }
      setSlotsLoading(true);
      setErrorMessage("");
      try {
        const formattedDate = formatDateForInput(date);
        const res = await axiosInstance.get(
          `/doctors/${docId}/available-slots?date=${formattedDate}`
        );
        setAvailableSlots(res.data || []);
      } catch (err) {
        console.error("Error fetching available slots:", err);
        setErrorMessage(
          err.response?.data?.message || "Could not fetch available time slots."
        );
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [axiosInstance, allowTimeChange]
  );

  useEffect(() => {
    if (initialDataLoaded) {
      const shouldFetchSlots =
        formData.doctorId && formData.appointmentDate && allowTimeChange;

      if (shouldFetchSlots) {
        fetchAvailableSlots(formData.doctorId, formData.appointmentDate);
      } else {
        setAvailableSlots([]);
      }
    }
  }, [
    formData.doctorId,
    formData.appointmentDate,
    fetchAvailableSlots,
    initialDataLoaded,
    allowTimeChange,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "doctorId") {
        const selectedDoc = doctors.find((doc) => doc._id === value);
        updated.duration = selectedDoc ? selectedDoc.appointmentDuration : "";
        updated.startTime = "";
      }
      if (name === "appointmentDate") {
        updated.startTime = "";
      }
      return updated;
    });
    setErrorMessage("");
  };

  const handleSlotSelect = (slot) => {
    if (!allowTimeChange) return;
    setFormData((prev) => ({ ...prev, startTime: slot }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitMessage("");

    if (!isEditing && !formData.patientPhone) {
      setErrorMessage("Please enter your contact phone number.");
      return;
    }

    if (allowTimeChange && !formData.startTime) {
      setErrorMessage("Please select an available time slot.");
      return;
    }

    if (!isDoctorView && !formData.doctorId) {
      setErrorMessage("Please select a physician.");
      return;
    }

    if (
      isEditing &&
      isDoctorView &&
      formData.status === "completed" &&
      (!formData.remarks || formData.remarks.trim() === "")
    ) {
      setErrorMessage(
        "Doctor's remarks are required to mark an appointment as completed."
      );
      return;
    }

    setLoading(true);
    let dataToSend = {};
    let requestMethod = isEditing ? "patch" : "post";
    let requestUrl = isEditing ? `/appointments/${id}` : "/appointments";

    if (isEditing) {
      dataToSend = {
        ...(allowTimeChange && { appointmentDate: formData.appointmentDate }),
        ...(allowTimeChange && { startTime: formData.startTime }),
        reason: formData.reason,
        ...(isDoctorView && { status: formData.status }),
        ...(isDoctorView && { remarks: formData.remarks }),
      };
      Object.keys(dataToSend).forEach((key) => {
        if (dataToSend[key] === undefined || dataToSend[key] === null) {
          delete dataToSend[key];
        }
      });
    } else {
      dataToSend = {
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        reason: formData.reason,
        patientPhone: formData.patientPhone,
      };
    }

    if (
      requestMethod === "post" &&
      (!dataToSend.doctorId ||
        !dataToSend.appointmentDate ||
        !dataToSend.startTime)
    ) {
      setErrorMessage("Missing required parameters for scheduling.");
      setLoading(false);
      return;
    }

    try {
      let responseMessage = "";
      if (isEditing) {
        await axiosInstance.patch(requestUrl, dataToSend);
        responseMessage = "Appointment updated successfully.";
      } else {
        await axiosInstance.post(requestUrl, dataToSend);
        responseMessage = "Appointment scheduled successfully.";
      }
      setSubmitMessage(responseMessage);
      const targetPath = isDoctorView ? "/doctor/dashboard" : "/appointments";
      setTimeout(() => navigate(targetPath, { replace: true }), 1000);
    } catch (err) {
      console.error(
        `Error ${isEditing ? "updating" : "scheduling"} appointment:`,
        err.response?.data || err.message || err
      );
      setErrorMessage(
        err.response?.data?.message ||
          `Error ${isEditing ? "updating" : "scheduling"} appointment.`
      );
      setLoading(false);
    }
  };

  const isCompletedDisabled =
    isEditing &&
    isDoctorView &&
    formData.status === "completed" &&
    (!formData.remarks || formData.remarks.trim() === "");

  const allowReasonChange =
    !isEditing ||
    (formData.status !== "completed" && formData.status !== "cancelled");

  const isSubmitDisabled =
    loading ||
    (isEditing &&
      isDoctorView &&
      formData.status === "completed" &&
      isCompletedDisabled);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 animate-materialize">
      {/* Return Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-mono-code text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors active:scale-[0.97]"
        >
          <ArrowLeft size={15} />
          <span>Return to Dashboard</span>
        </button>
      </div>

      <div className="doppelrand-shell">
        <div className="doppelrand-core p-7 sm:p-9">
          <div className="specular-hairline" />

          {/* Title Bar */}
          <div className="pb-5 mb-7 border-b border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {isEditing
                  ? isDoctorView
                    ? "Clinical Visit Management"
                    : "Reschedule Consultation"
                  : "Book Clinical Consultation"}
              </h2>
              <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {isDoctorView
                  ? "Update diagnostic evaluation, consultation status, and clinical remarks."
                  : "Select your physician, desired appointment date, and verified time slot."}
              </p>
            </div>
          </div>

          {/* Feedback Alerts */}
          {submitMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium font-mono-code flex items-center gap-2">
              <CheckCircle size={17} weight="bold" />
              <span>{submitMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium font-mono-code">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Credentials */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code block">
                Patient Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="patientName"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Patient Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      id="patientName"
                      value={formData.patientName}
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-100/60 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 text-xs font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="patientEmail"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <EnvelopeSimple size={16} />
                    </div>
                    <input
                      type="email"
                      id="patientEmail"
                      value={formData.patientEmail}
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-100/60 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 text-xs font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {!isEditing && !isDoctorView && (
                <div>
                  <label
                    htmlFor="patientPhone"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Contact Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      id="patientPhone"
                      name="patientPhone"
                      value={formData.patientPhone}
                      onChange={handleChange}
                      required
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Selection */}
            {!(isEditing && isDoctorView) && (
              <div className="space-y-3.5 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code block">
                  Healthcare Provider Selection
                </span>

                <div>
                  <label
                    htmlFor="doctorId"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Physician / Specialist *
                  </label>
                  {!isEditing && !isDoctorView ? (
                    <select
                      id="doctorId"
                      name="doctorId"
                      value={formData.doctorId}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose physician specialist...</option>
                      {doctors.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.name} — {doc.specialization} ({doc.appointmentDuration}m consult)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={`${formData._doctorName} (${formData._doctorSpecialization})`}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-100/60 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 text-xs font-medium cursor-not-allowed"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Schedule Date & Slot */}
            <div className="space-y-3.5 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code block">
                Appointment Schedule & Slot Generation
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="appointmentDate"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Appointment Date *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <CalendarBlank size={16} />
                    </div>
                    <input
                      type="date"
                      id="appointmentDate"
                      name="appointmentDate"
                      value={formData.appointmentDate}
                      onChange={handleChange}
                      required
                      disabled={!allowTimeChange || loading}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Time Slot *
                  </label>
                  <select
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required={allowTimeChange}
                    disabled={!allowTimeChange || slotsLoading || loading}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none disabled:opacity-60 cursor-pointer"
                  >
                    <option value="">
                      {!allowTimeChange
                        ? formatTime12Hour(formData.startTime)
                        : slotsLoading
                        ? "Querying clinic slot engine..."
                        : availableSlots.length === 0
                        ? "No slots available / Select date"
                        : "Select verified slot..."}
                    </option>
                    {allowTimeChange &&
                      availableSlots.map((slot) => {
                        const isOriginal = isEditing && slot === originalStartTime;
                        return (
                          <option key={slot} value={slot}>
                            {formatTime12Hour(slot)} {isOriginal ? "(Current)" : ""}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* Interactive Visual Slot Pill Matrix */}
              {allowTimeChange && availableSlots.length > 0 && (
                <div className="mt-3">
                  <span className="text-[10px] font-mono-code uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
                    Direct Slot Selection ({availableSlots.length} available):
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.06] max-h-48 overflow-y-auto">
                    {availableSlots.map((slot) => {
                      const isSelected = formData.startTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`py-2 px-2 rounded-xl text-xs font-mono-code transition-all active:scale-[0.95] flex items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-sky-500/15 border border-sky-500 text-sky-600 dark:text-sky-400 font-bold shadow-xs"
                              : "bg-white dark:bg-[#131720] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:border-sky-500/40"
                          }`}
                        >
                          <span>{formatTime12Hour(slot)}</span>
                          {isSelected && <CheckCircle size={12} weight="fill" className="text-sky-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-3.5 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code block">
                Clinical Context
              </span>

              <div>
                <label
                  htmlFor="reason"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                >
                  Consultation Purpose / Symptoms
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required={!isEditing}
                  rows="3"
                  disabled={!allowReasonChange || loading}
                  placeholder="Outline symptoms, reason for consult, or preliminary medical history..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-body focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Doctor Management (Status & Remarks) */}
            {isEditing && (isDoctorView || formData.remarks) && (
              <div className="space-y-3.5 pt-4 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/70 dark:bg-white/[0.02] p-4 sm:p-5 rounded-2xl border border-zinc-200/60 dark:border-white/[0.06]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono-code block">
                  Physician Diagnosis & Consultation Outcome
                </span>

                {isDoctorView && (
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                    >
                      Consultation Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#131720] text-zinc-950 dark:text-white text-xs font-mono-code font-semibold focus:ring-2 focus:ring-sky-500/30 focus:outline-none cursor-pointer"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="noshow">No Show</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="remarks"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Clinical Remarks {isDoctorView && formData.status === "completed" ? "*" : ""}
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    disabled={!isDoctorView || loading}
                    placeholder={
                      isDoctorView
                        ? "Enter diagnostic findings, therapeutic instructions, or follow-up timelines..."
                        : "No remarks provided."
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#131720] text-zinc-950 dark:text-white text-xs font-body focus:ring-2 focus:ring-sky-500/30 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-zinc-100 dark:border-white/[0.06] flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-10 px-5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all inline-flex items-center justify-center cursor-pointer"
              >
                Cancel / Return
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-10 pl-5 pr-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs tracking-tight inline-flex items-center justify-center gap-2.5 transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <SpinnerGap size={15} className="animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isEditing
                        ? isDoctorView
                          ? "Commit Clinical Outcome"
                          : "Save Updated Visit"
                        : "Confirm Consultation"}
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-white/15 dark:bg-zinc-950/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight size={13} weight="bold" />
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;
