import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom"; // Added useLocation
import AuthContext from "../context/AuthContext";

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};
// ---

const AppointmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const { user, axiosInstance } = useContext(AuthContext);

  const isEditing = !!id;
  const isDoctorView = user?.role === "doctor";

  // Extract prefill data from location state
  const prefillData = location.state?.prefillData;

  const [formData, setFormData] = useState({
    appointmentDate: "",
    startTime: "",
    reason: prefillData?.reason || "", // Use prefill data or default
    status: "scheduled",
    remarks: "",
    patientUserId: "",
    patientName: isDoctorView ? "" : user?.name || "",
    patientEmail: isDoctorView ? "" : user?.email || "",
    patientPhone: "",
    doctorId: prefillData?.doctorId || null, // Use prefill data or default
    duration: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch list of doctors (Needed for all modes now to get duration)
  useEffect(() => {
    // Don't run if editing, as doctor is fetched with appointment data
    if (isEditing) return;

    setLoading(true);
    axiosInstance
      .get("/doctors/list")
      .then((res) => {
        const fetchedDoctors = res.data || [];
        setDoctors(fetchedDoctors);
        // If doctorId was prefilled (meaning we are creating, not editing), find the duration
        if (formData.doctorId && !isEditing && fetchedDoctors.length > 0) {
          const selectedDoc = fetchedDoctors.find(
            (doc) => doc._id === formData.doctorId
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
  }, [axiosInstance, formData.doctorId, isEditing]); // Re-run if doctorId changes or if switching between edit/create

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
            ...rest
          } = res.data;
          // When editing, doctorId is populated, store the full object
          setFormData((prev) => ({
            ...prev,
            ...rest,
            appointmentDate: formatDate(appointmentDate),
            startTime: startTime || "",
            duration: duration || "",
            doctorId: doctorId || null, // Store populated doctor object
            patientUserId: patientUserId?._id || "",
            patientName: rest.patientName || patientUserId?.name || "",
            patientEmail: patientUserId?.email || "",
            patientPhone: patientPhone || "",
            remarks: rest.remarks || "",
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

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let newState = { ...prev, [name]: value };
      // If patient changes doctor manually during creation/rebooking
      if (!isEditing && !isDoctorView && name === "doctorId") {
        const selectedDoctor = doctors.find((doc) => doc._id === value);
        newState.duration = selectedDoctor
          ? selectedDoctor.appointmentDuration
          : "";
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
    let requestMethod = "patch";
    let requestUrl = `/appointments/${id}`;

    if (isEditing) {
      dataToSend = {
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        reason: formData.reason,
        ...(isDoctorView && { status: formData.status }),
        ...(isDoctorView && { remarks: formData.remarks }),
      };
    } else {
      // CREATION
      requestMethod = "post";
      requestUrl = "/appointments";
      dataToSend = {
        doctorId: formData.doctorId, // Send ID string
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
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
      navigate(targetPath, { replace: true }); // Immediate navigation
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
  };

  // --- Loading State ---
  if (loading && !submitMessage && !errorMessage) {
    return <div className="loading">Loading...</div>;
  }

  const isCompletedDisabled =
    isEditing &&
    isDoctorView &&
    (!formData.remarks || formData.remarks.trim() === "");

  // --- JSX Render ---
  return (
    <div className="appointment-form-container">
      <h2>{isEditing ? "Edit Appointment" : "Schedule New Appointment"}</h2>

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
        {/* Only show dropdown if patient is creating/rebooking */}
        {!isDoctorView && !isEditing && (
          <div className="form-group">
            <label htmlFor="doctorId">Doctor</label>
            <select
              id="doctorId"
              name="doctorId"
              value={formData.doctorId || ""} // Uses prefilled ID if available
              onChange={handleChange}
              required
              disabled={loading} // Disable while doctors are loading
            >
              <option value="">Select a doctor</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.specialization}) - {doc.appointmentDuration}{" "}
                  min slots
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Display doctor name when editing */}
        {isEditing && (
          <div className="form-group">
            <label>Doctor</label>
            <input
              type="text"
              value={`${formData.doctorId?.name || "N/A"} (${
                formData.doctorId?.specialization || "N/A"
              })`}
              disabled
            />
          </div>
        )}

        {/* Date, Time, Reason */}
        <div className="form-group">
          <label htmlFor="appointmentDate">Appointment Date</label>
          <input
            type="date"
            id="appointmentDate"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="startTime">Start Time</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
          {formData.duration && (
            <small> (Duration: {formData.duration} minutes)</small>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="reason">Reason for Visit</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
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
        {formData.status !== "cancelled" && (
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
