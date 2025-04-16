import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";

const AvailabilityManager = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { axiosInstance } = useContext(AuthContext); // Use configured axios

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/doctors/availability/standard")
      .then((res) => {
        setAvailability(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching availability:", err);
        setError(err.response?.data?.message || "Failed to load availability.");
        setLoading(false);
      });
  }, [axiosInstance]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      // Ensure data format matches backend expectation
      const dataToSend = { availabilitySlots: availability };
      await axiosInstance.put("/doctors/availability/standard", dataToSend);
      alert("Availability updated successfully!");
    } catch (err) {
      console.error("Error saving availability:", err);
      setError(err.response?.data?.message || "Failed to save availability.");
    } finally {
      setLoading(false);
    }
  };

  // TODO: Add UI elements to add, edit, remove availability slots
  // (e.g., dropdowns for day, time inputs for start/end)

  if (loading) return <div>Loading availability...</div>;
  if (error) return <div className="message error">{error}</div>;

  return (
    <div>
      <h4>Standard Weekly Availability</h4>
      {/* Display current availability */}
      {availability.length > 0 ? (
        <ul>
          {availability.map((slot, index) => (
            <li key={index}>
              {slot.dayOfWeek}: {slot.startTime} - {slot.endTime}
              {/* Add edit/delete buttons here */}
            </li>
          ))}
        </ul>
      ) : (
        <p>No standard availability set.</p>
      )}

      {/* Add Form Elements Here */}
      {/* Example: Button to add a new slot */}
      <button onClick={() => alert("Add slot UI not implemented yet!")}>
        Add New Slot
      </button>

      <button
        onClick={handleSave}
        disabled={loading}
        style={{ marginTop: "20px" }}
      >
        {loading ? "Saving..." : "Save Availability"}
      </button>
    </div>
  );
};

export default AvailabilityManager;
