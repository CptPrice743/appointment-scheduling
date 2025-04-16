// File Path: doctor-appointment-scheduling/client/src/components/SpecificAvailabilityCalendar.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AuthContext from "../context/AuthContext";
import "./SpecificAvailabilityCalendar.css";

// --- Constants and Helpers ---
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Format date for use as a key or sending to backend (local date parts)
const formatDateYYYYMMDD = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format date for displaying to the user (uses browser's locale)
const formatDateForDisplay = (date) => {
  // Takes Date object
  if (!date || !(date instanceof Date)) return "Invalid Date";
  try {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return date.toLocaleDateString(undefined, options); // Use the raw date object
  } catch (e) {
    return "Invalid Date";
  }
};

// Get day string from Date object using local day index
const getDayOfWeekStringFromDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
  const dayIndex = date.getDay(); // 0=Sun, 6=Sat (local)
  return DAYS_OF_WEEK[dayIndex];
};
// --- End Constants and Helpers ---

const SpecificAvailabilityCalendar = () => {
  // Initialize selectedDate without time component for consistency
  const initialDate = new Date();
  initialDate.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const [overrides, setOverrides] = useState({}); // Key: YYYY-MM-DD
  const [dayDetails, setDayDetails] = useState({
    date: formatDateYYYYMMDD(initialDate),
    isDayOff: false,
    isEditingSpecificTime: false,
    startTime: "",
    endTime: "",
    standardStartTime: "",
    standardEndTime: "",
    standardIsWorking: false,
    hasExistingOverride: false,
  });
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [error, setError] = useState("");
  const { axiosInstance, user } = useContext(AuthContext);
  const doctorProfile = user?.doctorProfile;

  // --- Fetch Overrides (Keep existing logic) ---
  const fetchOverrides = useCallback(async () => {
    setLoadingOverrides(true);
    setError("");
    try {
      const res = await axiosInstance.get("/doctors/availability/overrides");
      const fetchedOverrides = {};
      (res.data || []).forEach((ov) => {
        const ovDate = new Date(ov.date); // Date from backend (likely UTC)
        // Create key from UTC date parts to match potential backend storage format
        const year = ovDate.getUTCFullYear();
        const month = String(ovDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(ovDate.getUTCDate()).padStart(2, "0");
        const dateKey = `${year}-${month}-${day}`;
        fetchedOverrides[dateKey] = {
          isWorking: ov.isWorking,
          startTime: ov.startTime || "",
          endTime: ov.endTime || "",
        };
      });
      setOverrides(fetchedOverrides);
    } catch (err) {
      setError("Failed to load existing overrides.");
      console.error("Fetch Overrides Error:", err);
    } finally {
      setLoadingOverrides(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  // --- Get Standard Availability (Keep existing logic from previous fix) ---
  const getStandardAvailability = useCallback(
    (date) => {
      if (!doctorProfile?.standardAvailability) {
        return {
          standardIsWorking: false,
          standardStartTime: "",
          standardEndTime: "",
        };
      }
      const dayIndex = date.getDay(); // Use local day
      const dayOfWeekString = DAYS_OF_WEEK[dayIndex];
      const standardRule = doctorProfile.standardAvailability.find(
        (slot) => slot.dayOfWeek === dayOfWeekString
      );
      if (standardRule) {
        return {
          standardIsWorking: true,
          standardStartTime: standardRule.startTime,
          standardEndTime: standardRule.endTime,
        };
      } else {
        return {
          standardIsWorking: false,
          standardStartTime: "",
          standardEndTime: "",
        };
      }
    },
    [doctorProfile?.standardAvailability]
  );

  // *** UPDATED useEffect to calculate day details based on selectedDate ***
  useEffect(() => {
    // This effect now runs whenever selectedDate changes OR overrides data is updated
    if (!selectedDate) return; // Guard clause

    setDayLoading(true);
    const dateKey = formatDateYYYYMMDD(selectedDate); // Key based on the currently selected date
    const override = overrides[dateKey]; // Check if override exists for this date
    const { standardIsWorking, standardStartTime, standardEndTime } =
      getStandardAvailability(selectedDate); // Calculate standard for this date

    let initialStartTime = "";
    let initialEndTime = "";
    let initialIsDayOff = false;
    let initialIsEditing = false;
    let hasExistingOverride = false;

    if (override) {
      hasExistingOverride = true;
      initialIsDayOff = !override.isWorking;
      initialIsEditing = override.isWorking; // Show time inputs if override is 'working'
      initialStartTime = override.startTime;
      initialEndTime = override.endTime;
    } else {
      // No override - base state on standard availability
      initialIsDayOff = !standardIsWorking;
      initialStartTime = standardStartTime; // Store standard times for potential prefill
      initialEndTime = standardEndTime;
      initialIsEditing = false;
    }

    // Update the state for the editor section
    setDayDetails({
      date: dateKey,
      isDayOff: initialIsDayOff,
      isEditingSpecificTime: initialIsEditing,
      startTime: initialStartTime || "",
      endTime: initialEndTime || "",
      standardStartTime,
      standardEndTime,
      standardIsWorking,
      hasExistingOverride: hasExistingOverride,
    });

    setDayLoading(false);
    setError(""); // Clear error when date changes
  }, [selectedDate, overrides, getStandardAvailability]); // Re-run when selectedDate or overrides change

  // Handle date change on calendar
  const handleDateChange = (newDate) => {
    // Ensure time part is zeroed out to avoid potential timezone shifts affecting the date part
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate); // Update the state, triggering the useEffect above
  };

  // Handle changes in the override form inputs/checkboxes
  const handleDayInfoChange = (e) => {
    // ... (Keep existing logic from previous fix) ...
    const { name, value, type, checked } = e.target;
    setDayDetails((prev) => {
      const newState = { ...prev };
      if (type === "checkbox") {
        newState[name] = checked;
        if (name === "isDayOff" && checked) {
          newState.isEditingSpecificTime = false;
        }
        if (name === "isEditingSpecificTime" && checked) {
          newState.isDayOff = false;
          if (
            !newState.startTime &&
            !newState.endTime &&
            newState.standardIsWorking
          ) {
            newState.startTime = newState.standardStartTime;
            newState.endTime = newState.standardEndTime;
          }
          if (!newState.startTime && !newState.endTime) {
            newState.startTime = "09:00";
            newState.endTime = "17:00";
          }
        }
        if (name === "isEditingSpecificTime" && !checked) {
          newState.startTime = "";
          newState.endTime = "";
        }
      } else {
        newState[name] = value;
      }
      return newState;
    });
    setError("");
  };

  // --- API Calls (saveOverride, deleteOverride - keep existing logic) ---
  const saveOverride = async () => {
    // ... (Keep existing logic) ...
    setDayLoading(true);
    setError("");
    const { date, isDayOff, isEditingSpecificTime, startTime, endTime } =
      dayDetails;
    let payload;
    if (isDayOff) {
      payload = { date, isWorking: false };
    } else if (isEditingSpecificTime) {
      if (!startTime || !endTime || startTime >= endTime) {
        setError("Valid start/end times required (end must be after start).");
        setDayLoading(false);
        return;
      }
      payload = { date, isWorking: true, startTime, endTime };
    } else {
      setError(
        "Select 'Set Specific Hours' or 'Take the day off' to save an override."
      );
      setDayLoading(false);
      return;
    }
    try {
      await axiosInstance.post("/doctors/availability/overrides", payload);
      setOverrides((prev) => ({
        ...prev,
        [date]: {
          isWorking: payload.isWorking,
          startTime: payload.startTime || "",
          endTime: payload.endTime || "",
        },
      }));
      setDayDetails((prev) => ({ ...prev, hasExistingOverride: true }));
      alert("Override saved successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save override.");
      console.error("Save Override Error:", err);
    } finally {
      setDayLoading(false);
    }
  };

  const deleteOverride = async () => {
    // ... (Keep existing logic) ...
    if (!dayDetails.hasExistingOverride) return;
    if (
      !window.confirm(
        `Are you sure you want to remove the specific settings for ${formatDateForDisplay(
          selectedDate
        )}? Standard schedule will apply.`
      )
    )
      return; // Use selectedDate for confirmation msg
    setDayLoading(true);
    setError("");
    try {
      await axiosInstance.delete(
        `/doctors/availability/overrides/${dayDetails.date}`
      );
      const newOverrides = { ...overrides };
      delete newOverrides[dayDetails.date];
      setOverrides(newOverrides); // This will trigger the useEffect to update dayDetails
      alert("Override removed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove override.");
      console.error("Delete Override Error:", err);
    } finally {
      setDayLoading(false);
    }
  };
  // --- End API Calls ---

  // Function to add class names to calendar tiles
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      // Zero out time part for consistent comparison
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      const dateKey = formatDateYYYYMMDD(dateOnly); // Format key consistently

      const override = overrides[dateKey];
      if (override) {
        return override.isWorking ? "has-override-working" : "has-override-off";
      }
      const { standardIsWorking } = getStandardAvailability(dateOnly); // Use dateOnly here too
      if (standardIsWorking) {
        return "standard-working";
      }
    }
    return null;
  };

  const canSaveChanges =
    dayDetails.isDayOff || dayDetails.isEditingSpecificTime;

  return (
    <div className="override-manager">
      <h4>Set Specific Date Availability / Time Off</h4>
      <p className="info-text">
        Select a date to set specific working hours or mark it as a day off.
        This overrides your standard weekly schedule for that date only.
      </p>

      {loadingOverrides && <div className="loading">Loading overrides...</div>}

      <div className="calendar-container">
        <Calendar
          onChange={handleDateChange} // This updates selectedDate state
          value={selectedDate} // Calendar reflects selectedDate state
          minDate={new Date()}
          tileClassName={tileClassName}
        />
      </div>

      <div className="selected-day-editor">
        {/* *** FIX: Use selectedDate directly for display formatting *** */}
        <h5>Settings for: {formatDateForDisplay(selectedDate)}</h5>

        {error && <div className="message error">{error}</div>}

        {dayLoading ? (
          <div className="loading-day">Loading...</div>
        ) : (
          <>
            {/* Checkboxes */}
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isEditingSpecificTime"
                name="isEditingSpecificTime"
                checked={dayDetails.isEditingSpecificTime}
                onChange={handleDayInfoChange}
                disabled={dayDetails.isDayOff}
              />
              <label htmlFor="isEditingSpecificTime">
                Set specific hours for this date?
              </label>
            </div>
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isDayOff"
                name="isDayOff"
                checked={dayDetails.isDayOff}
                onChange={handleDayInfoChange}
              />
              <label htmlFor="isDayOff">Take the day off?</label>
            </div>

            {/* Time Inputs */}
            {dayDetails.isEditingSpecificTime && !dayDetails.isDayOff && (
              <div className="form-group time-range">
                <label>Specific Hours:</label>
                {/* ... time inputs ... */}
                <div>
                  <input
                    type="time"
                    name="startTime"
                    value={dayDetails.startTime}
                    onChange={handleDayInfoChange}
                    required
                  />
                  <span> to </span>
                  <input
                    type="time"
                    name="endTime"
                    value={dayDetails.endTime}
                    onChange={handleDayInfoChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* {dayDetails.isDayOff && (
              <p className="day-off-indicator">
                Marked as **Not Working** for this specific date.
              </p>
            )} */}

            {/* Buttons */}
            <div className="button-group">
              <button
                onClick={saveOverride}
                disabled={dayLoading || !canSaveChanges}
                className="save-override-btn"
                title={
                  !canSaveChanges
                    ? "Select an option above to save an override"
                    : "Save override for this date"
                }
              >
                {dayLoading ? "Saving..." : "Save Override for this Date"}
              </button>
              {dayDetails.hasExistingOverride && (
                <button
                  onClick={deleteOverride}
                  disabled={dayLoading}
                  className="delete-override-btn"
                >
                  Remove Override (Use Standard)
                </button>
              )}
            </div>

            {/* Standard Info Display */}
            <p className="standard-info">
              Standard availability for this day:
              {dayDetails.standardIsWorking
                ? ` ${dayDetails.standardStartTime} - ${dayDetails.standardEndTime}`
                : " Not scheduled"}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SpecificAvailabilityCalendar;
