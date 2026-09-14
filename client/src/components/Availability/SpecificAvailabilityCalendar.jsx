import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AuthContext from "../../context/AuthContext";
import "./SpecificAvailabilityCalendar.css";
import {
  CalendarBlank,
  Clock,
  CheckCircle,
  WarningCircle,
  Trash,
  FloppyDisk,
  Info,
} from "@phosphor-icons/react";

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
      const dataList = Array.isArray(res.data) ? res.data : [];
      dataList.forEach((ov) => {
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
    <div className="doppelrand-shell">
      <div className="doppelrand-core p-6 sm:p-7 space-y-6">
        <div className="specular-hairline" />

        <div className="pb-5 border-b border-zinc-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <CalendarBlank className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-display font-bold text-zinc-950 dark:text-white tracking-tight">
                Date-Specific Availability & Overrides
              </h4>
              <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Customize single-day working hours or scheduled clinical leaves.
              </p>
            </div>
          </div>
          <span className="font-mono-code text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/[0.06] self-start sm:self-auto">
            Priority Engine Active
          </span>
        </div>

        {loadingOverrides && (
          <div className="text-xs font-mono-code text-zinc-400 text-center py-2">
            Loading practice overrides...
          </div>
        )}

        {/* Calendar View */}
        <div className="calendar-container">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            minDate={new Date()}
            tileClassName={tileClassName}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-mono-code text-zinc-500 dark:text-zinc-400 py-3 border-y border-zinc-200/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500"></span>
            <span>Specific Hours Override</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-dashed border-rose-400"></span>
            <span>Clinical Day Off</span>
          </div>
        </div>

        {/* Selected Day Editor Box */}
        <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-display font-semibold text-sm text-zinc-950 dark:text-white">
              Schedule For: <span className="text-sky-600 dark:text-sky-400 font-mono-code">{formatDateForDisplay(selectedDate)}</span>
            </h5>
          </div>

          {/* Display Messages */}
          {overrideMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{overrideMessage}</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <WarningCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {dayLoading ? (
            <div className="text-xs font-mono-code text-zinc-400 text-center py-4">
              Synchronizing override parameters...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-[#131720] hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    id="isEditingSpecificTime"
                    name="isEditingSpecificTime"
                    checked={dayDetails.isEditingSpecificTime}
                    onChange={handleDayInfoChange}
                    disabled={dayDetails.isDayOff}
                    className="w-4 h-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 select-none">
                    Define specific hours
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-[#131720] hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    id="isDayOff"
                    name="isDayOff"
                    checked={dayDetails.isDayOff}
                    onChange={handleDayInfoChange}
                    className="w-4 h-4 rounded border-zinc-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 select-none">
                    Mark as unavailable (day off)
                  </span>
                </label>
              </div>

              {/* Time Inputs */}
              {dayDetails.isEditingSpecificTime && !dayDetails.isDayOff && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#131720] border border-zinc-200/80 dark:border-white/[0.08] animate-materialize">
                  <label className="block text-[10px] font-mono-code uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5 font-semibold">
                    Specific Operational Hours
                  </label>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                    <input
                      type="time"
                      name="startTime"
                      value={dayDetails.startTime}
                      onChange={handleDayInfoChange}
                      required
                      className="flex-1 min-w-[120px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                    />
                    <span className="text-xs font-mono-code text-zinc-400 font-semibold">TO</span>
                    <input
                      type="time"
                      name="endTime"
                      value={dayDetails.endTime}
                      onChange={handleDayInfoChange}
                      required
                      className="flex-1 min-w-[120px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Day Off Indicator */}
              {dayDetails.isDayOff && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                  <WarningCircle className="w-4 h-4 shrink-0" />
                  <span>Marked as unavailable for consultations on this date.</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={saveOverride}
                  disabled={dayLoading || !canSaveChanges}
                  className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-all active:scale-[0.97] cursor-pointer"
                >
                  <FloppyDisk className="w-4 h-4" />
                  <span>{dayLoading ? "Saving..." : "Commit Override"}</span>
                </button>

                {dayDetails.hasExistingOverride && (
                  <button
                    onClick={deleteOverride}
                    disabled={dayLoading}
                    className="h-9 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs font-semibold inline-flex items-center gap-2 transition-all active:scale-[0.97] cursor-pointer"
                  >
                    <Trash className="w-4 h-4" />
                    <span>Revert to Standard Schedule</span>
                  </button>
                )}
              </div>

              {/* Standard Info */}
              <div className="pt-3 border-t border-zinc-200/60 dark:border-white/[0.06] flex items-center gap-2 text-[11px] font-mono-code text-zinc-400">
                <Info className="w-4 h-4 shrink-0 text-sky-500" />
                <span>Standard Baseline:</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                  {dayDetails.standardIsWorking
                    ? `${dayDetails.standardStartTime} - ${dayDetails.standardEndTime}`
                    : "Not Scheduled"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecificAvailabilityCalendar;
