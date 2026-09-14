import React, { useState, useEffect, useContext, useCallback } from "react";
import AuthContext from "../../context/AuthContext";
import {
  Clock,
  Plus,
  Trash,
  FloppyDisk,
  CheckCircle,
  WarningCircle,
  CalendarCheck,
} from "@phosphor-icons/react";

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
  const [successMessage, setSuccessMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
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
    setNewSlot({ dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00" });
    setIsAdding(false);
    setError("");
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
    setSuccessMessage("");
    try {
      for (const slot of availability) {
        if (slot.startTime >= slot.endTime) {
          throw new Error(
            `Invalid time range for ${slot.dayOfWeek}: ${slot.startTime} - ${slot.endTime}. End time must be after start time.`
          );
        }
      }
      const dataToSend = { availabilitySlots: availability };
      await axiosInstance.put("/doctors/availability/standard", dataToSend);
      setSuccessMessage("Availability schedule saved successfully.");
      setTimeout(() => setSuccessMessage(""), 3500);
      fetchAvailability();
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
    <div className="availability-manager bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h4 className="text-lg font-heading font-semibold text-slate-900 dark:text-white">
              Standard Weekly Availability
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure recurrent practice days and operating clinic hours.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="add-slot-toggle-btn inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-medium transition-colors border border-teal-200/60 dark:border-teal-800/60"
          >
            <Plus className="w-4 h-4" />
            Add Time Slot
          </button>
        )}
      </div>

      {error && (
        <div className="message error mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <WarningCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="message success mt-4 p-3.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 rounded-xl text-teal-700 dark:text-teal-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Add Slot Expandable Panel */}
      {isAdding && (
        <div className="add-slot-form mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 animate-materialize">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Add New Operating Slot
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Day of Week
              </label>
              <select
                name="dayOfWeek"
                value={newSlot.dayOfWeek}
                onChange={handleNewSlotChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={newSlot.startTime}
                onChange={handleNewSlotChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={newSlot.endTime}
                onChange={handleNewSlotChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleAddSlot}
              className="add-slot-confirm-btn px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Add Slot
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="add-slot-cancel-btn px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Slots List */}
      <div className="availability-list mt-5 space-y-2 max-h-72 overflow-y-auto pr-1">
        {loading && availability.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Loading availability schedule...
          </div>
        ) : availability.length > 0 ? (
          availability.map((slot, index) => (
            <div
              key={index}
              className="availability-slot-display flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-teal-100/70 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-xs font-medium">
                  {slot.dayOfWeek}
                </span>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {slot.startTime} to {slot.endTime}
                </span>
              </div>
              <button
                onClick={() => handleDeleteSlot(index)}
                className="delete-slot-btn text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                aria-label={`Delete slot ${index + 1}`}
                title="Delete this slot"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          !loading && (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No standard availability hours configured yet. Click above to add slots.
            </div>
          )
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="save-availability-btn w-full mt-6 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-colors btn-press cursor-pointer"
      >
        <FloppyDisk className="w-4 h-4" />
        {loading ? "Saving Schedule..." : "Save All Changes"}
      </button>
    </div>
  );
};

export default AvailabilityManager;
