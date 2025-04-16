import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

// Placeholder for doctor data - replace with API call in a real app
const doctors = [
  { id: 1, name: "Dr. Smith", type: "Cardiologist" },
  { id: 2, name: "Dr. Johnson", type: "Pediatrician" },
  { id: 3, name: "Dr. Williams", type: "Dermatologist" },
  { id: 4, name: "Dr. Brown", type: "General Practitioner" },
];

const AppointmentForm = () => {
  const { id } = useParams(); // Get ID from URL for editing
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(!!id);
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    doctorName: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    status: "scheduled",
    remarks: "", // Remarks field still needed in state
  });
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // If editing, fetch appointment data
    if (isEditing && id) {
      setLoading(true);
      axios
        .get(`http://localhost:8000/api/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const { appointmentDate, ...rest } = res.data;
          setFormData({
            ...rest,
            appointmentDate: appointmentDate.split("T")[0], // Format date for input
            remarks: rest.remarks || "", // Ensure remarks is not undefined
          });
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching appointment:", err);
          setErrorMessage("Failed to load appointment data.");
          setLoading(false);
        });
    }
  }, [id, isEditing, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
    setSubmitMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitMessage("");
    setLoading(true);

    // Frontend check: Remarks required if setting status to completed (Only relevant when editing)
    if (
      isEditing &&
      formData.status === "completed" &&
      (!formData.remarks || formData.remarks.trim() === "")
    ) {
      setErrorMessage(
        "Remarks are required to mark an appointment as completed."
      );
      setLoading(false);
      return;
    }

    // Prepare data, ensuring remarks is included only if editing or if it has a value
    const dataToSend = { ...formData };
    if (!isEditing) {
      // Don't send an empty remarks field when creating
      delete dataToSend.remarks;
    }

    try {
      if (isEditing) {
        await axios.patch(
          `http://localhost:8000/api/appointments/${id}`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSubmitMessage("Appointment updated successfully!");
      } else {
        await axios.post("http://localhost:8000/api/appointments", dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSubmitMessage("Appointment scheduled successfully!");
      }
      setTimeout(() => {
        navigate("/appointments");
      }, 1500);
    } catch (err) {
      console.error("Error submitting form:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage(
          `Error ${
            isEditing ? "updating" : "scheduling"
          } appointment. Please try again.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="loading">Loading appointment details...</div>;
  }

  // Disable 'Completed' status if editing and remarks are empty
  const isCompletedDisabled =
    isEditing &&
    formData.status === "completed" &&
    (!formData.remarks || formData.remarks.trim() === "");

  return (
    <div className="appointment-form-container">
      <h2>{isEditing ? "Edit Appointment" : "Schedule New Appointment"}</h2>

      {submitMessage && <div className="message success">{submitMessage}</div>}

      {errorMessage && <div className="message error">{errorMessage}</div>}

      <form onSubmit={handleSubmit} className="appointment-form">
        {/* Patient Details */}
        <div className="form-group">
          <label htmlFor="patientName">Patient Name</label>
          <input
            type="text"
            id="patientName"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="patientEmail">Email</label>
          <input
            type="email"
            id="patientEmail"
            name="patientEmail"
            value={formData.patientEmail}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="patientPhone">Phone</label>
          <input
            type="tel"
            id="patientPhone"
            name="patientPhone"
            value={formData.patientPhone}
            onChange={handleChange}
            required
          />
        </div>

        {/* Doctor Selection */}
        <div className="form-group">
          <label htmlFor="doctorName">Doctor</label>
          <select
            id="doctorName"
            name="doctorName"
            value={formData.doctorName}
            onChange={handleChange}
            required
          >
            <option value="">Select a doctor</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.name}>
                {doc.name} ({doc.type})
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
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
          <label htmlFor="appointmentTime">Appointment Time</label>
          <input
            type="time"
            id="appointmentTime"
            name="appointmentTime"
            value={formData.appointmentTime}
            onChange={handleChange}
            required
          />
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
          ></textarea>
        </div>

        {/* Remarks (Conditionally Rendered) */}
        {isEditing && (
          <div className="form-group">
            <label htmlFor="remarks">Doctor's Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="4"
              placeholder="Add remarks here (required for completion)..."
            ></textarea>
          </div>
        )}

        {/* Status */}
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="scheduled">Scheduled</option>
            <option
              value="completed"
              disabled={isCompletedDisabled}
              title={
                isCompletedDisabled ? "Remarks are required to complete" : ""
              }
            >
              Completed {isCompletedDisabled ? "(Remarks Required)" : ""}
            </option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading
            ? "Submitting..."
            : isEditing
            ? "Update Appointment"
            : "Schedule Appointment"}
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
