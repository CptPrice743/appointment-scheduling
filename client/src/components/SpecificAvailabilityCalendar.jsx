import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AuthContext from "../context/AuthContext";
import "./SpecificAvailabilityCalendar.css";

// --- Constants and Helpers ---
// Ensure this matches the 'enum' in your Doctor.js model exactly
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Format date for use as a key or sending to backend (YYYY-MM-DD)
const formatDateYYYYMMDD = (date) => {
  if (!date || !(date instanceof Date)) return "";
  // Use local date parts to form the key, as this matches user selection intention
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format date for displaying to the user (e.g., "Wednesday, April 16, 2025")
const formatDateForDisplay = (date) => {
  if (!date || !(date instanceof Date)) return "Invalid Date";
  try {
    // Use the Date object directly for reliable local formatting
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return date.toLocaleDateString(undefined, options);
  } catch (e) {
    console.error("Error formatting date for display:", e);
    return "Invalid Date";
  }
};

// Get day string from Date object using local day index
const getDayOfWeekStringFromDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
  const dayIndex = date.getDay(); // 0=Sun, 6=Sat (local time)
  return DAYS_OF_WEEK[dayIndex];
};
// --- End Constants and Helpers ---

const SpecificAvailabilityCalendar = () => {
  // --- State ---
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
  const [loadingOverrides, setLoadingOverrides] = useState(false); // Loading all overrides
  const [dayLoading, setDayLoading] = useState(false); // Loading/saving specific day
  const [error, setError] = useState(""); // Error messages for this component
  const [overrideMessage, setOverrideMessage] = useState(""); // Success messages for this component
  const overrideMsgTimeoutRef = useRef(null); // Timeout ref for messages

  const { axiosInstance, user } = useContext(AuthContext);
  const doctorProfile = user?.doctorProfile; // Access doctor profile from context

  // --- Effects ---

  // Clear message timeout on unmount
  useEffect(() => {
    return () => clearTimeout(overrideMsgTimeoutRef.current);
  }, []);

  // Auto-clear Override success/error messages
  useEffect(() => {
    if (overrideMessage || error) {
      clearTimeout(overrideMsgTimeoutRef.current);
      overrideMsgTimeoutRef.current = setTimeout(() => {
        setOverrideMessage("");
        setError("");
      }, 3000); // Hide after 3 seconds
    }
    return () => clearTimeout(overrideMsgTimeoutRef.current);
  }, [overrideMessage, error]);

  // Fetch all overrides on mount
  const fetchOverrides = useCallback(async () => {
    setLoadingOverrides(true);
    setError(""); // Clear error before fetch
    try {
      const res = await axiosInstance.get("/doctors/availability/overrides");
      const fetchedOverrides = {};
      (res.data || []).forEach((ov) => {
        const ovDate = new Date(ov.date); // Date from backend (likely UTC)
        // Create key using YYYY-MM-DD format from UTC parts
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

  // Get Standard Availability for a specific date (with safety check)
  const getStandardAvailability = useCallback(
    (date) => {
      // ** SAFETY CHECK **
      if (
        !doctorProfile ||
        !Array.isArray(doctorProfile.standardAvailability)
      ) {
        // console.log("Standard check: Doctor profile or standardAvailability array is missing/invalid.");
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
    [doctorProfile]
  ); // Depend on doctorProfile

  // Update displayed day details when selected date or overrides change
  useEffect(() => {
    if (!selectedDate) return;
    setDayLoading(true);
    const dateKey = formatDateYYYYMMDD(selectedDate); // Key based on local selected date
    const override = overrides[dateKey];
    const { standardIsWorking, standardStartTime, standardEndTime } =
      getStandardAvailability(selectedDate);

    let initialStartTime = "",
      initialEndTime = "",
      initialIsDayOff = false,
      initialIsEditing = false,
      hasExistingOverride = false;

    if (override) {
      hasExistingOverride = true;
      initialIsDayOff = !override.isWorking;
      initialIsEditing = override.isWorking;
      initialStartTime = override.startTime;
      initialEndTime = override.endTime;
    } else {
      initialIsDayOff = !standardIsWorking;
      initialStartTime = standardStartTime;
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
    // Clear messages when date changes
    // setError("");
    // setOverrideMessage("");
    setDayLoading(false);
  }, [selectedDate, overrides, getStandardAvailability]);

  // --- Handlers ---
  const handleDateChange = (newDate) => {
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
    // Clear messages on date change
    setOverrideMessage("");
    setError("");
  };

  const handleDayInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDayDetails((prev) => {
      const newState = { ...prev };
      if (type === "checkbox") {
        newState[name] = checked;
        // Logic for the two checkboxes
        if (name === "isDayOff" && checked)
          newState.isEditingSpecificTime = false;
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
    // Clear messages on input change
    setOverrideMessage("");
    setError("");
  };

  // Save Override API Call
  const saveOverride = async () => {
    setDayLoading(true);
    setError("");
    setOverrideMessage(""); // Clear previous messages

    const { date, isDayOff, isEditingSpecificTime, startTime, endTime } =
      dayDetails;
    let payload;
    // Determine payload based on checkbox states
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
        "Select 'Set specific hours' or 'Take the day off' to save an override."
      );
      setDayLoading(false);
      return;
    }

    try {
      await axiosInstance.post("/doctors/availability/overrides", payload);
      // Update local overrides state to immediately reflect change
      setOverrides((prev) => ({
        ...prev,
        [date]: {
          isWorking: payload.isWorking,
          startTime: payload.startTime || "",
          endTime: payload.endTime || "",
        },
      }));
      // Update details state to match saved override
      setDayDetails((prev) => ({ ...prev, hasExistingOverride: true })); // Ensures 'Remove' button appears
      setError(""); // Clear error on success
      setOverrideMessage("Override saved successfully!"); // Set success message
    } catch (err) {
      setOverrideMessage(""); // Clear success on error
      setError(err.response?.data?.message || "Failed to save override."); // Set error message
      console.error("Save Override Error:", err);
    } finally {
      setDayLoading(false);
    }
  };

  // Delete Override API Call
  const deleteOverride = async () => {
    if (!dayDetails.hasExistingOverride) return;
    // Keep browser confirmation
    if (
      !window.confirm(
        `Are you sure you want to remove the specific settings for ${formatDateForDisplay(
          selectedDate
        )}? Standard schedule will apply.`
      )
    )
      return;

    setDayLoading(true);
    setError("");
    setOverrideMessage(""); // Clear messages
    try {
      await axiosInstance.delete(
        `/doctors/availability/overrides/${dayDetails.date}`
      );
      // Update local overrides state (removing the key triggers useEffect)
      const newOverrides = { ...overrides };
      delete newOverrides[dayDetails.date];
      setOverrides(newOverrides);
      setError(""); // Clear error on success
      setOverrideMessage("Override removed successfully."); // Set success message
    } catch (err) {
      setOverrideMessage(""); // Clear success on error
      setError(err.response?.data?.message || "Failed to remove override."); // Set error message
      console.error("Delete Override Error:", err);
    } finally {
      setDayLoading(false);
    }
  };
  // --- End Handlers ---

  // --- Tile ClassName (with safety check) ---
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      const dateKey = formatDateYYYYMMDD(dateOnly);
      const override = overrides[dateKey];
      if (override) {
        return override.isWorking ? "has-override-working" : "has-override-off";
      }
      const { standardIsWorking } = getStandardAvailability(dateOnly); // Safe call
      if (standardIsWorking) {
        return "standard-working";
      }
    }
    return null;
  };

  // --- Render Logic ---
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
          onChange={handleDateChange}
          value={selectedDate}
          minDate={new Date()} // Prevent selecting past dates
          tileClassName={tileClassName}
        />
      </div>

      <div className="selected-day-editor">
        <h5>Settings for: {formatDateForDisplay(selectedDate)}</h5>

        {/* Display Inline Override Messages Here */}
        {overrideMessage && (
          <div className="message success">{overrideMessage}</div>
        )}
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

            {/* Time Inputs - Shown Conditionally */}
            {dayDetails.isEditingSpecificTime && !dayDetails.isDayOff && (
              <div className="form-group time-range">
                <label>Specific Hours:</label>
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

            {/* Day Off Indicator */}
            {dayDetails.isDayOff && (
              <p className="day-off-indicator">
                Marked as **Not Working** for this specific date.
              </p>
            )}

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
