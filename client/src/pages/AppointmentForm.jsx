import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
// Corrected CSS import path assuming the CSS is in the same directory
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

  // State to store the original time when editing
  const [originalStartTime, setOriginalStartTime] = useState(null);
  // State to track initial data load to prevent premature validation checks if needed
  const [initialDataLoaded, setInitialDataLoaded] = useState(!isEditing);

  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(isEditing); // Start loading if editing
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Logic to determine if time/date can be changed
  const allowTimeChange = !isEditing || formData.status === "scheduled";

  // Fetch list of doctors (for patient booking dropdown)
  useEffect(() => {
    if (!isEditing && !isDoctorView) {
      setLoading(true); // Ensure loading is true while fetching doctors
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
    // No else needed here, loading state handled by appointment fetch effect when editing
  }, [axiosInstance, isEditing, isDoctorView, prefillData?.doctorId]);

  // Fetch appointment data if editing
  useEffect(() => {
    if (isEditing && id) {
      // setLoading(true); // Loading is set initially
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
            duration: fetchedDuration, // Use fetched duration directly
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
          setOriginalStartTime(startTime || null); // Store the original time

          // Fetch doctor's duration if not included in appointment data (or if needed for consistency)
          if (populatedDoctorId) {
            // Always fetch associated doctor details for consistency, like duration
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
                console.error(
                  "Could not fetch doctor details on edit load",
                  err
                )
              )
              .finally(() => {
                setLoading(false); // Stop loading after appointment and doctor details are fetched
                setInitialDataLoaded(true); // Mark initial load complete
              });
          } else {
            setLoading(false); // Stop loading if no doctorId to fetch
            setInitialDataLoaded(true); // Mark initial load complete
          }
        })
        .catch((err) => {
          console.error("Error fetching appointment:", err);
          setErrorMessage(
            err.response?.data?.message || "Failed to load appointment data."
          );
          setLoading(false);
          setInitialDataLoaded(true); // Mark load complete even on error
        });
    }
  }, [id, isEditing, axiosInstance]);

  // --- Fetch Available Slots ---
  const fetchAvailableSlots = useCallback(
    async (docId, date) => {
      // Only fetch if allowed to change time AND doctor/date are present
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
    [axiosInstance, allowTimeChange] // Dependency includes allowTimeChange
  );

  // Trigger fetchAvailableSlots when doctorId or appointmentDate changes if allowed
  useEffect(() => {
    // Only fetch slots if initial data is loaded (for editing) or if creating new
    if (initialDataLoaded) {
      const shouldFetchSlots =
        formData.doctorId && formData.appointmentDate && allowTimeChange;

      if (shouldFetchSlots) {
        fetchAvailableSlots(formData.doctorId, formData.appointmentDate);
      } else {
        setAvailableSlots([]); // Clear slots if conditions aren't met
      }
    }
  }, [
    formData.doctorId,
    formData.appointmentDate,
    allowTimeChange,
    initialDataLoaded, // Ensure initial data is loaded before fetching slots based on it
    fetchAvailableSlots,
  ]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let newState = { ...prev, [name]: value };

      if (name === "doctorId" && !isDoctorView) {
        const selectedDoctor = doctors.find((doc) => doc._id === value);
        newState.duration = selectedDoctor?.appointmentDuration || "";
        newState.appointmentDate = formatDateForInput(new Date());
        newState.startTime = "";
        setAvailableSlots([]);
        setOriginalStartTime(null);
      }

      if (name === "appointmentDate") {
        // Reset time selection when date changes
        newState.startTime = "";
        // Available slots will be cleared and re-fetched by the useEffect hook
      }

      // If doctor changes status TO scheduled, ensure time is still valid or cleared
      if (
        name === "status" &&
        value === "scheduled" &&
        isDoctorView &&
        isEditing
      ) {
        // If the current time is not in the fetched slots for the current date, clear it
        // Note: This assumes availableSlots are already fetched for the current date
        if (
          newState.startTime &&
          !availableSlots.includes(newState.startTime)
        ) {
          console.log(
            `Current time ${newState.startTime} not available for status change, clearing.`
          );
          // newState.startTime = ''; // Optionally clear, or rely on validation
        }
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

    // Validation
    // Require time selection if user is allowed to change time
    if (allowTimeChange && !formData.startTime) {
      setErrorMessage("Please select an available time slot.");
      return;
    }
    // Ensure selected time is actually in the available slots if changing time
    if (
      allowTimeChange &&
      formData.startTime &&
      !availableSlots.includes(formData.startTime) &&
      formData.startTime !== originalStartTime
    ) {
      // This case should ideally not happen if dropdown is built correctly, but as a safeguard:
      setErrorMessage(
        `Selected time ${formatTime12Hour(
          formData.startTime
        )} is not valid for this date. Please select from the list.`
      );
      return;
    }
    // If the selected time IS the original time, but it's no longer in availableSlots (e.g. doctor changed availability), block update.
    if (
      allowTimeChange &&
      formData.startTime &&
      formData.startTime === originalStartTime &&
      !availableSlots.includes(originalStartTime)
    ) {
      setErrorMessage(
        `The original time (${formatTime12Hour(
          originalStartTime
        )}) is no longer available for this date. Please select a different time.`
      );
      // Clear the invalid selection?
      // setFormData(prev => ({...prev, startTime: ''}));
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
      // Determine which fields have actually changed compared to the initial state if needed,
      // but for simplicity, send relevant fields based on permissions.
      dataToSend = {
        ...(allowTimeChange && { appointmentDate: formData.appointmentDate }),
        ...(allowTimeChange && { startTime: formData.startTime }),
        reason: formData.reason, // Assuming reason can always be updated if form allows
        ...(isDoctorView && { status: formData.status }),
        ...(isDoctorView && { remarks: formData.remarks }),
      };
      // Remove fields that weren't allowed to change or don't have values
      Object.keys(dataToSend).forEach((key) => {
        if (dataToSend[key] === undefined || dataToSend[key] === null) {
          delete dataToSend[key];
        }
      });
      // Prevent sending empty update if nothing relevant changed (optional)
      // const hasChanges = Object.keys(dataToSend).some(key => /* comparison logic needed */);
      // if (!hasChanges) { setLoading(false); setErrorMessage("No changes detected."); return; }
    } else {
      dataToSend = {
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        reason: formData.reason,
        patientPhone: formData.patientPhone,
      };
    }

    // Final check for required fields before sending
    if (
      requestMethod === "post" &&
      (!dataToSend.doctorId ||
        !dataToSend.appointmentDate ||
        !dataToSend.startTime) /*|| !dataToSend.reason - reason might be optional */
    ) {
      setErrorMessage("Missing required fields for scheduling.");
      setLoading(false);
      return;
    }
    if (requestMethod === "patch" && Object.keys(dataToSend).length === 0) {
      setErrorMessage("No valid updates provided.");
      setLoading(false);
      return;
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

  // --- Derived State for UI ---
  // Check if remarks are needed for completion status
  const isCompletedDisabled =
    isEditing &&
    isDoctorView &&
    formData.status === "completed" &&
    (!formData.remarks || formData.remarks.trim() === "");

  // Determine if reason field should be editable
  const allowReasonChange =
    !isEditing ||
    (formData.status !== "completed" && formData.status !== "cancelled");

  // ** MODIFICATION: Simplified Submit Button Disabled Logic **
  const isSubmitDisabled =
    loading ||
    (isEditing &&
      isDoctorView &&
      formData.status === "completed" &&
      isCompletedDisabled);

  // --- Loading State ---
  // Show loading indicator only if loading is true AND there's no submit/error message yet
  if (loading && !submitMessage && !errorMessage) {
    return <div className="loading">Loading...</div>;
  }

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
        {/* Patient Details Section */}
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
        {!isEditing && !isDoctorView && (
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

        {/* Doctor Section (Conditionally Rendered) */}
        {!(isEditing && isDoctorView) && (
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
        )}

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
            disabled={!allowTimeChange || loading}
          />
        </div>

        {/* Time Slot Selection */}
        <div className="form-group">
          <label htmlFor="startTime">
            {allowTimeChange ? "Available Time Slots" : "Appointment Time"}
          </label>
          <select
            id="startTime"
            name="startTime"
            value={formData.startTime} // Controlled component
            onChange={handleChange}
            required={allowTimeChange} // Only require if changeable
            disabled={!allowTimeChange || slotsLoading || loading}
          >
            {/* Default/Placeholder Option */}
            <option value="">
              {!allowTimeChange
                ? formatTime12Hour(formData.startTime) // Show saved time if not changeable
                : slotsLoading
                ? "Loading slots..."
                : availableSlots.length === 0
                ? "No slots available / Select date" // Simplified placeholder
                : "Select a time slot..."}
            </option>

            {/* ** MODIFICATION: Map through available slots and mark original ** */}
            {allowTimeChange &&
              availableSlots.map((slot) => {
                const isOriginal = isEditing && slot === originalStartTime;
                const displayTime = formatTime12Hour(slot);
                return (
                  <option key={slot} value={slot}>
                    {displayTime}
                    {isOriginal ? " (Original)" : ""}
                  </option>
                );
              })}
            {/* Removed the separate blocks that added non-available original times */}
          </select>
          {formData.duration &&
            (!slotsLoading || !allowTimeChange) && ( // Show duration if loaded or not changing time
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
            required={!isEditing}
            rows="3"
            disabled={!allowReasonChange || loading}
          ></textarea>
        </div>

        {/* Remarks */}
        {isEditing && (isDoctorView || formData.remarks) && (
          <div className="form-group">
            <label htmlFor="remarks">
              {isDoctorView ? "Doctor's Remarks" : "Doctor's Remarks"}
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="4"
              placeholder={
                isDoctorView
                  ? "Add remarks here (required for completion)..."
                  : ""
              }
              disabled={
                !isDoctorView || formData.status === "cancelled" || loading
              }
            ></textarea>
          </div>
        )}

        {/* Status */}
        {isEditing && (
          <div className="form-group">
            <label htmlFor="status">Status</label>
            {isDoctorView ? (
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={formData.status === "cancelled" || loading}
              >
                <option value="scheduled">Scheduled</option>
                <option
                  value="completed"
                  disabled={
                    isCompletedDisabled && formData.status !== "completed"
                  } // Disable only if trying to set completed without remarks
                  title={isCompletedDisabled ? "Add remarks to complete" : ""}
                >
                  Completed {isCompletedDisabled ? "(Remarks Required)" : ""}
                </option>
                <option value="noshow">No Show</option>
                <option
                  value="cancelled"
                  disabled={formData.status !== "cancelled"}
                >
                  Cancelled
                </option>
              </select>
            ) : (
              <input
                type="text"
                value={
                  formData.status.charAt(0).toUpperCase() +
                  formData.status.slice(1)
                }
                disabled
              />
            )}
          </div>
        )}

        {/* Submit Button */}
        {!(
          isEditing &&
          !isDoctorView &&
          (formData.status === "completed" || formData.status === "cancelled")
        ) && (
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitDisabled} // ** MODIFICATION: Use simplified disabled logic **
          >
            {loading
              ? "Submitting..."
              : isEditing
              ? "Update Appointment"
              : "Schedule Appointment"}
          </button>
        )}

        {/* Cancel/Back button */}
        <button
          type="button"
          className="cancel-btn"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          Cancel / Back {/* Changed text back based on previous request */}
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
