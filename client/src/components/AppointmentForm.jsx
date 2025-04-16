import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "./AppointmentForm.css";


// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    // Format for display
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }; // Specify UTC for consistency
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
// ---

const AppointmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, axiosInstance } = useContext(AuthContext);

  const isEditing = !!id;
  const isDoctorView = user?.role === "doctor";

  // Extract prefill data from location state (e.g., for rebooking)
  const prefillData = location.state?.prefillData;

  const [formData, setFormData] = useState({
    appointmentDate: formatDateForInput(new Date()), // Default to today for new appointments
    startTime: "", // This will now be selected from available slots
    reason: prefillData?.reason || "",
    status: "scheduled",
    remarks: "",
    patientUserId: "", // Set when editing
    patientName: isDoctorView ? "" : user?.name || "",
    patientEmail: isDoctorView ? "" : user?.email || "",
    patientPhone: "", // Patient will fill this in
    doctorId: prefillData?.doctorId || "", // Use prefill data or default
    duration: "", // Will be fetched from doctor
    // Fields to store fetched data
    _doctorName: "", // Store doctor name when editing/viewing
    _doctorSpecialization: "", // Store doctor spec when editing/viewing
  });

  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch list of doctors (for patient booking dropdown)
  useEffect(() => {
    if (!isEditing && !isDoctorView) {
      // Only needed when patient is creating
      setLoading(true);
      axiosInstance
        .get("/doctors/list")
        .then((res) => {
          setDoctors(res.data || []);
          // If doctorId was prefilled, set the duration
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
  }, [axiosInstance, isEditing, isDoctorView, prefillData?.doctorId]); // Dependency on prefill data

  // Fetch appointment data if editing
  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
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
            patientName: fetchedPatientName, // Renamed to avoid conflict
            reason,
            status,
            remarks,
            // doctorId might be populated or just an ID, handle both
          } = res.data;

          setFormData((prev) => ({
            ...prev,
            appointmentDate: formatDateForInput(appointmentDate),
            startTime: startTime || "",
            duration: duration || "",
            doctorId: doctorId?._id || doctorId || "", // Store just the ID
            patientUserId: patientUserId?._id || "",
            patientName: fetchedPatientName || patientUserId?.name || "",
            patientEmail: patientUserId?.email || "",
            patientPhone: patientPhone || "",
            reason: reason || "",
            status: status || "scheduled",
            remarks: remarks || "",
            // Store doctor details separately for display
            _doctorName: doctorId?.name || "N/A",
            _doctorSpecialization: doctorId?.specialization || "N/A",
          }));
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching appointment:", err);
          setErrorMessage(
            err.response?.data?.message || "Failed to load appointment data."
          );
          setLoading(false);
        });
    }
  }, [id, isEditing, axiosInstance]);

  // --- Fetch Available Slots ---
  const fetchAvailableSlots = useCallback(
    async (docId, date) => {
      if (!docId || !date) {
        setAvailableSlots([]);
        return;
      }
      setSlotsLoading(true);
      setErrorMessage(""); // Clear previous errors
      setFormData((prev) => ({ ...prev, startTime: "" })); // Reset selected time
      try {
        const formattedDate = formatDateForInput(date); // Ensure YYYY-MM-DD
        const res = await axiosInstance.get(
          `/doctors/${docId}/available-slots?date=${formattedDate}`
        );
        setAvailableSlots(res.data || []);
      } catch (err) {
        console.error("Error fetching available slots:", err);
        setErrorMessage(
          err.response?.data?.message || "Could not fetch available time slots."
        );
        setAvailableSlots([]); // Clear slots on error
      } finally {
        setSlotsLoading(false);
      }
    },
    [axiosInstance]
  ); // Add axiosInstance

  // Trigger fetchAvailableSlots when doctorId or appointmentDate changes (only for patient creating/editing)
  useEffect(() => {
    // Fetch slots if:
    // 1. Patient is creating/editing (!isDoctorView)
    // 2. We have a selected doctor (formData.doctorId)
    // 3. We have a selected date (formData.appointmentDate)
    // 4. We are NOT editing OR if editing, status is 'scheduled' (allow rescheduling)
    if (
      !isDoctorView &&
      formData.doctorId &&
      formData.appointmentDate &&
      (!isEditing || formData.status === "scheduled")
    ) {
      fetchAvailableSlots(formData.doctorId, formData.appointmentDate);
    } else {
      // Clear slots if conditions aren't met (e.g., doctor not selected, or viewing completed/cancelled appt)
      setAvailableSlots([]);
    }
  }, [
    formData.doctorId,
    formData.appointmentDate,
    isDoctorView,
    isEditing,
    formData.status,
    fetchAvailableSlots,
  ]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let newState = { ...prev, [name]: value };
      // If patient changes doctor during creation/rebooking, reset date/time and fetch duration
      if (!isDoctorView && name === "doctorId") {
        const selectedDoctor = doctors.find((doc) => doc._id === value);
        newState.duration = selectedDoctor
          ? selectedDoctor.appointmentDuration
          : "";
        // Reset date/time/slots when doctor changes
        newState.appointmentDate = formatDateForInput(new Date()); // Reset date to today
        newState.startTime = ""; // Clear selected time
        setAvailableSlots([]); // Clear slots list
      }
      // If date changes, reset time
      if (name === "appointmentDate") {
        newState.startTime = "";
        setAvailableSlots([]); // Clear slots list
      }
      return newState;
    });
    setErrorMessage("");
    setSubmitMessage("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitMessage("");

    // Validation for booking/rescheduling
    if (!isDoctorView && !formData.startTime) {
      setErrorMessage("Please select an available time slot.");
      return;
    }
    if (!isDoctorView && !formData.doctorId) {
      setErrorMessage("Please select a doctor.");
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
      // Prepare data for PATCH request
      dataToSend = {
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        reason: formData.reason,
        ...(isDoctorView && { status: formData.status }),
        ...(isDoctorView && { remarks: formData.remarks }),
        // No need to send doctorId or patient info for PATCH
      };
      // Only send startTime if it's actually set (patient might only update reason)
      if (!dataToSend.startTime && !isDoctorView) {
        delete dataToSend.startTime;
        delete dataToSend.appointmentDate; // Don't send date if time isn't sent
      } else if (!dataToSend.startTime && isDoctorView) {
        // If doctor updates only status/remarks, don't send empty time/date
        delete dataToSend.startTime;
        delete dataToSend.appointmentDate;
      }
    } else {
      // Prepare data for POST request
      dataToSend = {
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime, // The selected slot
        reason: formData.reason,
        patientPhone: formData.patientPhone,
      };
    }

    try {
      let responseMessage = "";
      if (isEditing) {
        await axiosInstance.patch(requestUrl, dataToSend);
        responseMessage = "Appointment updated successfully!";
      } else {
        await axiosInstance.post(requestUrl, dataToSend);
        responseMessage = "Appointment scheduled successfully!";
      }
      setSubmitMessage(responseMessage);
      const targetPath = isDoctorView ? "/doctor/dashboard" : "/appointments";
      // Use timeout for user to see the message before redirecting
      setTimeout(() => navigate(targetPath, { replace: true }), 1500);
    } catch (err) {
      console.error(
        `Error ${isEditing ? "updating" : "scheduling"} appointment:`,
        err.response?.data || err.message || err
      );
      setErrorMessage(
        err.response?.data?.message ||
          `Error ${isEditing ? "updating" : "scheduling"} appointment.`
      );
      setLoading(false); // Set loading false only on error
    }
    // Keep loading true on success until redirect timeout
  };

  // --- Loading State ---
  if (loading && !submitMessage && !errorMessage) {
    return <div className="loading">Loading...</div>;
  }

  const isCompletedDisabled =
    isEditing &&
    isDoctorView &&
    (!formData.remarks || formData.remarks.trim() === "");
  const allowTimeChange =
    !isDoctorView && (!isEditing || formData.status === "scheduled");
  const allowReasonChange =
    !isDoctorView ||
    (isEditing &&
      formData.status !== "completed" &&
      formData.status !== "cancelled"); // Allow doctor to edit reason unless completed/cancelled

  return (
    <div className="appointment-form-container">
      <h2>
        {isEditing
          ? isDoctorView
            ? "View/Manage Appointment"
            : "Edit Appointment"
          : "Schedule New Appointment"}
      </h2>

      {submitMessage && <div className="message success">{submitMessage}</div>}
      {errorMessage && <div className="message error">{errorMessage}</div>}

      <form onSubmit={handleSubmit} className="appointment-form">
        {/* Patient Details Section (Read-only for this form now) */}
        {isEditing && (
          <>
            <div className="form-group">
              <label>Patient Name</label>
              <input type="text" value={formData.patientName} disabled />
            </div>
            <div className="form-group">
              <label>Patient Email</label>
              <input type="email" value={formData.patientEmail} disabled />
            </div>
            <div className="form-group">
              <label>Patient Phone</label>
              <input
                type="tel"
                value={formData.patientPhone || "N/A"}
                disabled
              />
            </div>
          </>
        )}
        {!isDoctorView && !isEditing && (
          <>
            <div className="form-group">
              <label htmlFor="patientName">Your Name</label>
              <input
                type="text"
                id="patientName"
                value={formData.patientName}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="patientEmail">Your Email</label>
              <input
                type="email"
                id="patientEmail"
                value={formData.patientEmail}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="patientPhone">Your Phone</label>
              <input
                type="tel"
                id="patientPhone"
                name="patientPhone"
                value={formData.patientPhone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>
          </>
        )}

        {/* Doctor Section */}
        <div className="form-group">
          <label htmlFor="doctorId">Doctor</label>
          {!isEditing && !isDoctorView ? (
            <select
              id="doctorId"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select a doctor...</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.specialization})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={`${formData._doctorName} (${formData._doctorSpecialization})`}
              disabled
            />
          )}
        </div>

        {/* Date Selection */}
        <div className="form-group">
          <label htmlFor="appointmentDate">Appointment Date</label>
          <input
            type="date"
            id="appointmentDate"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
            required
            disabled={!allowTimeChange} // Disable if not patient or not rescheduling
          />
        </div>

        {/* Time Slot Selection (Replaces Time Input) */}
        <div className="form-group">
          <label htmlFor="startTime">Available Time Slots</label>
          <select
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            disabled={
              !allowTimeChange ||
              slotsLoading ||
              availableSlots.length === 0 ||
              !formData.appointmentDate ||
              !formData.doctorId
            }
          >
            <option value="">
              {slotsLoading
                ? "Loading slots..."
                : availableSlots.length > 0
                ? "Select a time slot..."
                : "No slots available for this date"}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {formatTime12Hour(slot)}
              </option>
            ))}
          </select>
          {formData.duration && !slotsLoading && availableSlots.length > 0 && (
            <small> (Appt. Duration: {formData.duration} minutes)</small>
          )}
        </div>

        {/* Reason */}
        <div className="form-group">
          <label htmlFor="reason">Reason for Visit</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            disabled={!allowReasonChange}
          ></textarea>
        </div>

        {/* Remarks (Doctor Edit View / Patient Read View) */}
        {isEditing && isDoctorView && (
          <div className="form-group">
            <label htmlFor="remarks">Doctor's Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="4"
              placeholder="Add remarks here (required for completion)..."
              disabled={formData.status === "cancelled"}
            ></textarea>
          </div>
        )}
        {isEditing && !isDoctorView && formData.remarks && (
          <div className="form-group">
            <label>Doctor's Remarks</label>
            <textarea value={formData.remarks} rows="4" disabled></textarea>
          </div>
        )}

        {/* Status (Doctor Edit View / Patient Read View) */}
        {isEditing && isDoctorView && (
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              disabled={formData.status === "cancelled"}
            >
              <option value="scheduled">Scheduled</option>
              <option
                value="completed"
                disabled={isCompletedDisabled}
                title={isCompletedDisabled ? "Add remarks to complete" : ""}
              >
                Completed {isCompletedDisabled ? "(Remarks Required)" : ""}
              </option>
              <option value="noshow">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
        {isEditing && !isDoctorView && (
          <div className="form-group">
            <label>Status</label>
            <input
              type="text"
              value={
                formData.status.charAt(0).toUpperCase() +
                formData.status.slice(1)
              }
              disabled
            />
          </div>
        )}

        {/* Submit Button */}
        {/* Show button unless viewing a completed/cancelled appointment as a patient */}
        {!(
          isEditing &&
          !isDoctorView &&
          (formData.status === "completed" || formData.status === "cancelled")
        ) && (
          <button
            type="submit"
            className="submit-btn"
            disabled={
              loading ||
              (isDoctorView &&
                isEditing &&
                formData.status === "completed" &&
                isCompletedDisabled)
            }
          >
            {loading
              ? "Submitting..."
              : isEditing
              ? "Update Appointment"
              : "Schedule Appointment"}
          </button>
        )}
      </form>
    </div>
  );
};

export default AppointmentForm;
