// File Path: doctor-appointment-scheduling/client/src/components/AvailabilityManager.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import AuthContext from "../context/AuthContext";
import "./AvailabilityManager.css";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const AvailabilityManager = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false); // State to show/hide add form
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });
  const { axiosInstance } = useContext(AuthContext);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/doctors/availability/standard");
      // Sort fetched data for consistent display
      const sortedAvailability = (res.data || []).sort(
        (a, b) =>
          DAYS_OF_WEEK.indexOf(a.dayOfWeek) -
            DAYS_OF_WEEK.indexOf(b.dayOfWeek) ||
          a.startTime.localeCompare(b.startTime)
      );
      setAvailability(sortedAvailability);
    } catch (err) {
      console.error("Error fetching availability:", err);
      setError(err.response?.data?.message || "Failed to load availability.");
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleNewSlotChange = (e) => {
    setNewSlot({ ...newSlot, [e.target.name]: e.target.value });
  };

  const handleAddSlot = () => {
    // Basic validation before adding locally
    if (!newSlot.dayOfWeek || !newSlot.startTime || !newSlot.endTime) {
      setError("Please fill in all fields for the new slot.");
      return;
    }
    if (newSlot.startTime >= newSlot.endTime) {
      setError("End time must be after start time.");
      return;
    }

    const updatedAvailability = [...availability, newSlot].sort(
      (a, b) =>
        DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek) ||
        a.startTime.localeCompare(b.startTime)
    );
    setAvailability(updatedAvailability);
    // Reset form and hide it
    setNewSlot({ dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" });
    setIsAdding(false);
    setError(""); // Clear error on successful local add
  };

  const handleDeleteSlot = (indexToDelete) => {
    const updatedAvailability = availability.filter(
      (_, index) => index !== indexToDelete
    );
    setAvailability(updatedAvailability);
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      // Validate all slots before saving
      for (const slot of availability) {
        if (slot.startTime >= slot.endTime) {
          throw new Error(
            `Invalid time range for ${slot.dayOfWeek}: ${slot.startTime} - ${slot.endTime}. End time must be after start time.`
          );
        }
      }
      const dataToSend = { availabilitySlots: availability };
      await axiosInstance.put("/doctors/availability/standard", dataToSend);
      alert("Availability updated successfully!");
      fetchAvailability(); // Re-fetch to ensure consistency and sorting
    } catch (err) {
      console.error("Error saving availability:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save availability."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="availability-manager">
      <h4>Standard Weekly Availability</h4>

      {error && <div className="message error">{error}</div>}

      {loading && availability.length === 0 && (
        <div>Loading availability...</div>
      )}

      <div className="availability-list">
        {availability.length > 0
          ? availability.map((slot, index) => (
              <div key={index} className="availability-slot-display">
                <span>
                  {slot.dayOfWeek}: {slot.startTime} - {slot.endTime}
                </span>
                <button
                  onClick={() => handleDeleteSlot(index)}
                  className="delete-slot-btn"
                  aria-label={`Delete slot ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))
          : !loading && <p>No standard availability set. Add slots below.</p>}
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="add-slot-toggle-btn"
        >
          + Add New Time Slot
        </button>
      )}

      {isAdding && (
        <div className="add-slot-form">
          <select
            name="dayOfWeek"
            value={newSlot.dayOfWeek}
            onChange={handleNewSlotChange}
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <input
            type="time"
            name="startTime"
            value={newSlot.startTime}
            onChange={handleNewSlotChange}
            required
          />
          <span> to </span>
          <input
            type="time"
            name="endTime"
            value={newSlot.endTime}
            onChange={handleNewSlotChange}
            required
          />
          <button onClick={handleAddSlot} className="add-slot-confirm-btn">
            Add
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className="add-slot-cancel-btn"
          >
            Cancel
          </button>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="save-availability-btn"
      >
        {loading ? "Saving..." : "Save All Changes"}
      </button>
    </div>
  );
};

export default AvailabilityManager;
