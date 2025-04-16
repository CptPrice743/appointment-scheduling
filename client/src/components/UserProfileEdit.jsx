// File Path: doctor-appointment-scheduling/client/src/components/UserProfileEdit.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import SpecificAvailabilityCalendar from "./SpecificAvailabilityCalendar";
// Assuming styles are appropriately managed (e.g., in index.css or dedicated files)
import "./AvailabilityManager.css";
import "./SpecificAvailabilityCalendar.css";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKENDS = ["Saturday", "Sunday"];

// Helper to safely get time from availability array
const getTimeForDayType = (availability, days, type) => {
  for (const day of days) {
    const slot = availability?.find((s) => s.dayOfWeek === day); // Add safety check for availability
    if (slot) {
      return type === "start" ? slot.startTime : slot.endTime;
    }
  }
  // Return a sensible default if no slot found
  return type === "start" ? "09:00" : "17:00";
};

const UserProfileEdit = () => {
  // *** Deconstruct setUser from context ***
  const {
    user,
    setUser,
    axiosInstance,
    isLoading: authLoading,
    error: authError,
    clearError,
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const isDoctor = user?.role === "doctor";

  // Profile State
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  // Simplified Standard Availability State
  const [stdAvailabilityData, setStdAvailabilityData] = useState({
    weekdayStartTime: "09:00",
    weekdayEndTime: "17:00",
    worksWeekends: false,
    weekendStartTime: "10:00",
    weekendEndTime: "14:00",
  });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // --- Standard Availability Functions ---
  const fetchStandardAvailability = useCallback(async () => {
    // Added checks for user and doctorProfile existence
    if (!isDoctor || !user?.doctorProfile?.standardAvailability) {
      if (isDoctor) {
        // If doctor but profile/availability missing, show appropriate message/defaults
        console.warn(
          "Doctor profile or standard availability not found on user object during fetch."
        );
        setStdAvailabilityData({
          // Reset to defaults maybe?
          weekdayStartTime: "09:00",
          weekdayEndTime: "17:00",
          worksWeekends: false,
          weekendStartTime: "10:00",
          weekendEndTime: "14:00",
        });
      }
      return;
    }
    setAvailabilityLoading(true);
    setAvailabilityError("");
    try {
      // Fetch from backend to ensure latest data
      const res = await axiosInstance.get("/doctors/availability/standard");
      const currentAvailability = res.data || [];

      // Parse into simplified state
      const weekdayStart = getTimeForDayType(
        currentAvailability,
        WEEKDAYS,
        "start"
      );
      const weekdayEnd = getTimeForDayType(
        currentAvailability,
        WEEKDAYS,
        "end"
      );
      const worksOnWeekends = currentAvailability.some((s) =>
        WEEKENDS.includes(s.dayOfWeek)
      );
      const weekendStart = worksOnWeekends
        ? getTimeForDayType(currentAvailability, WEEKENDS, "start")
        : "10:00";
      const weekendEnd = worksOnWeekends
        ? getTimeForDayType(currentAvailability, WEEKENDS, "end")
        : "14:00";

      setStdAvailabilityData({
        weekdayStartTime: weekdayStart,
        weekdayEndTime: weekdayEnd,
        worksWeekends: worksOnWeekends,
        weekendStartTime: weekendStart,
        weekendEndTime: weekendEnd,
      });
    } catch (err) {
      console.error("Error fetching standard availability:", err);
      setAvailabilityError(
        err.response?.data?.message || "Failed to load standard availability."
      );
      setStdAvailabilityData({
        // Reset to defaults on error
        weekdayStartTime: "09:00",
        weekdayEndTime: "17:00",
        worksWeekends: false,
        weekendStartTime: "10:00",
        weekendEndTime: "14:00",
      });
    } finally {
      setAvailabilityLoading(false);
    }
    // *** Added user?.doctorProfile?.standardAvailability to dependencies ***
    // This helps re-parse if the context updates from elsewhere, though saving should be the main trigger
  }, [axiosInstance, isDoctor, user?.doctorProfile?.standardAvailability]);

  // Populate forms and fetch availability
  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || "", email: user.email || "" });
      if (isDoctor && user.doctorProfile) {
        // Parse the availability already present in the context first for immediate display
        const currentAvailability =
          user.doctorProfile.standardAvailability || [];
        const weekdayStart = getTimeForDayType(
          currentAvailability,
          WEEKDAYS,
          "start"
        );
        const weekdayEnd = getTimeForDayType(
          currentAvailability,
          WEEKDAYS,
          "end"
        );
        const worksOnWeekends = currentAvailability.some((s) =>
          WEEKENDS.includes(s.dayOfWeek)
        );
        const weekendStart = worksOnWeekends
          ? getTimeForDayType(currentAvailability, WEEKENDS, "start")
          : "10:00";
        const weekendEnd = worksOnWeekends
          ? getTimeForDayType(currentAvailability, WEEKENDS, "end")
          : "14:00";
        setStdAvailabilityData({
          weekdayStartTime: weekdayStart,
          weekdayEndTime: weekdayEnd,
          worksWeekends: worksOnWeekends,
          weekendStartTime: weekendStart,
          weekendEndTime: weekendEnd,
        });
        // Optional: Fetch again to ensure it's the absolute latest from DB?
        // fetchStandardAvailability();
      }
    }
    setProfileError("");
    setProfileMessage("");
    setAvailabilityError("");
    clearError();
  }, [user, isDoctor]); // Removed fetchStandardAvailability from here to avoid loop potentially

  const handleAvailabilityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStdAvailabilityData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setAvailabilityError("");
    setProfileMessage("");
  };

  // *** MODIFIED Save Availability Function ***
  const handleSaveAvailability = async () => {
    if (!isDoctor) return;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    setProfileMessage("");

    const {
      weekdayStartTime,
      weekdayEndTime,
      worksWeekends,
      weekendStartTime,
      weekendEndTime,
    } = stdAvailabilityData;

    // Validation
    if (
      !weekdayStartTime ||
      !weekdayEndTime ||
      weekdayStartTime >= weekdayEndTime
    ) {
      setAvailabilityError(
        "Valid weekday start and end times are required, end time must be after start time."
      );
      setAvailabilityLoading(false);
      return;
    }
    if (
      worksWeekends &&
      (!weekendStartTime ||
        !weekendEndTime ||
        weekendStartTime >= weekendEndTime)
    ) {
      setAvailabilityError(
        "Valid weekend start and end times are required if working weekends, end time must be after start time."
      );
      setAvailabilityLoading(false);
      return;
    }

    // Reconstruct the detailed availability array
    const newStandardAvailability = [];
    WEEKDAYS.forEach((day) => {
      newStandardAvailability.push({
        dayOfWeek: day,
        startTime: weekdayStartTime,
        endTime: weekdayEndTime,
      });
    });
    if (worksWeekends) {
      WEEKENDS.forEach((day) => {
        newStandardAvailability.push({
          dayOfWeek: day,
          startTime: weekendStartTime,
          endTime: weekendEndTime,
        });
      });
    }

    try {
      const dataToSend = { availabilitySlots: newStandardAvailability };
      // The backend PUT returns the saved array, not the full doctor object currently.
      // If backend was changed to return full doctor object, use that in setUser.
      await axiosInstance.put("/doctors/availability/standard", dataToSend);

      // *** FIX: Update AuthContext state locally ***
      if (user && user.doctorProfile) {
        const updatedDoctorProfile = {
          ...user.doctorProfile,
          standardAvailability: newStandardAvailability, // Update with the newly constructed array
        };
        const updatedUser = {
          ...user,
          doctorProfile: updatedDoctorProfile,
        };
        setUser(updatedUser); // Update context
        localStorage.setItem("user", JSON.stringify(updatedUser)); // Update local storage
        console.log("AuthContext updated with new standard availability."); // Debug log
      }
      // *** End FIX ***

      setProfileMessage("Standard availability updated successfully!");
      // No need to fetch again as we updated context directly
    } catch (err) {
      console.error("Error saving availability:", err);
      setAvailabilityError(
        err.response?.data?.message || "Failed to save standard availability."
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };
  // --- End Standard Availability Functions ---

  // --- Profile Functions (Remain the same) ---
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setProfileMessage("");
    setProfileError("");
    clearError();
    setAvailabilityError("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    clearError();
    setAvailabilityError("");

    setLoadingProfile(true);
    const updateData = { name: profileData.name, email: profileData.email };

    try {
      // Assume backend returns the updated user object WITH populated doctorProfile
      const res = await axiosInstance.patch("/users/profile/me", updateData);
      setProfileError("");
      setProfileMessage("Profile updated successfully!");
      setUser(res.data); // Update user in context - this should have latest profile info
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.error("Error updating profile:", err);
      setProfileMessage("");
      setProfileError(
        err.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- Render Logic ---
  if (authLoading || !user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="user-profile-edit-container">
      {/* Profile Section */}
      <div className="profile-section">
        <h2>Edit Your Profile</h2>
        {profileMessage && (
          <div className="message success">{profileMessage}</div>
        )}
        {profileError && <div className="message error">{profileError}</div>}
        {authError && !profileError && (
          <div className="message error">{authError}</div>
        )}

        <form onSubmit={handleProfileSubmit} className="profile-form">
          {/* ... name and email inputs ... */}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              required
            />
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={loadingProfile}
          >
            {loadingProfile ? "Saving Profile..." : "Update Profile"}
          </button>
        </form>
      </div>

      {/* Availability Sections (Doctor Only) */}
      {isDoctor && (
        <>
          {/* Simplified Standard Availability Editor */}
          <div className="profile-section">
            <h4>Edit Standard Weekly Availability</h4>
            <p className="info-text">Set your default weekly working hours.</p>
            {availabilityError && (
              <div className="message error">{availabilityError}</div>
            )}
            {availabilityLoading && <div>Loading...</div>}
            {!availabilityLoading && (
              <fieldset className="availability-fieldset">
                <legend>Default Weekly Hours</legend>
                {/* Weekday Inputs */}
                <div className="form-group time-range">
                  <label>Weekdays (Mon-Fri)</label>
                  <div>
                    <input
                      type="time"
                      name="weekdayStartTime"
                      value={stdAvailabilityData.weekdayStartTime}
                      onChange={handleAvailabilityChange}
                      required
                    />
                    <span> to </span>
                    <input
                      type="time"
                      name="weekdayEndTime"
                      value={stdAvailabilityData.weekdayEndTime}
                      onChange={handleAvailabilityChange}
                      required
                    />
                  </div>
                </div>
                {/* Weekend Checkbox & Inputs */}
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="worksWeekends"
                    name="worksWeekends"
                    checked={stdAvailabilityData.worksWeekends}
                    onChange={handleAvailabilityChange}
                  />
                  <label htmlFor="worksWeekends">
                    Work on Weekends (Sat-Sun)?
                  </label>
                </div>
                {stdAvailabilityData.worksWeekends && (
                  <div className="form-group time-range">
                    <label>Weekends (Sat-Sun)</label>
                    <div>
                      <input
                        type="time"
                        name="weekendStartTime"
                        value={stdAvailabilityData.weekendStartTime}
                        onChange={handleAvailabilityChange}
                        required={stdAvailabilityData.worksWeekends}
                      />
                      <span> to </span>
                      <input
                        type="time"
                        name="weekendEndTime"
                        value={stdAvailabilityData.weekendEndTime}
                        onChange={handleAvailabilityChange}
                        required={stdAvailabilityData.worksWeekends}
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={handleSaveAvailability}
                  disabled={availabilityLoading}
                  className="save-availability-btn submit-btn"
                >
                  {availabilityLoading
                    ? "Saving..."
                    : "Save Standard Availability"}
                </button>
              </fieldset>
            )}
          </div>

          {/* Specific Date Override Calendar */}
          <div className="profile-section">
            {/* Pass user profile data to ensure it uses the latest context */}
            <SpecificAvailabilityCalendar
              key={JSON.stringify(user?.doctorProfile?.standardAvailability)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfileEdit;
