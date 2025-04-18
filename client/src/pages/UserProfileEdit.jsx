import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react"; // Import useRef
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import SpecificAvailabilityCalendar from "../components/Availability/SpecificAvailabilityCalendar";
// Corrected CSS imports: Remove imports belonging to other components
import "./UserProfileEdit.css"; // Import CSS for this component/page
import "../index.css"; // Keep global CSS import

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKENDS = ["Saturday", "Sunday"];

const getTimeForDayType = (availability, days, type) => {
  for (const day of days) {
    const slot = availability?.find((s) => s.dayOfWeek === day);
    if (slot) {
      return type === "start" ? slot.startTime : slot.endTime;
    }
  }
  return type === "start" ? "09:00" : "17:00";
};

const UserProfileEdit = () => {
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

  // State variables
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [stdAvailabilityData, setStdAvailabilityData] = useState({
    weekdayStartTime: "09:00",
    weekdayEndTime: "17:00",
    worksWeekends: false,
    weekendStartTime: "10:00",
    weekendEndTime: "14:00",
  });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");

  // Refs for Timeout IDs
  const profileMsgTimeoutRef = useRef(null);
  const availabilityMsgTimeoutRef = useRef(null);

  // --- UseEffect Hooks ---

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(profileMsgTimeoutRef.current);
      clearTimeout(availabilityMsgTimeoutRef.current);
    };
  }, []);

  // Auto-clear Profile messages
  useEffect(() => {
    if (profileMessage || profileError) {
      console.log(
        "PROFILE message/error detected:",
        profileMessage || profileError
      ); // DEBUG
      clearTimeout(profileMsgTimeoutRef.current);
      profileMsgTimeoutRef.current = setTimeout(() => {
        console.log("Clearing profile message/error"); // DEBUG
        setProfileMessage("");
        setProfileError("");
      }, 3000);
    }
    return () => clearTimeout(profileMsgTimeoutRef.current);
  }, [profileMessage, profileError]);

  // Auto-clear Availability messages
  useEffect(() => {
    if (availabilityMessage || availabilityError) {
      console.log(
        "AVAILABILITY message/error detected:",
        availabilityMessage || availabilityError
      ); // DEBUG
      clearTimeout(availabilityMsgTimeoutRef.current);
      availabilityMsgTimeoutRef.current = setTimeout(() => {
        console.log("Clearing availability message/error"); // DEBUG
        setAvailabilityMessage("");
        setAvailabilityError("");
      }, 3000);
    }
    return () => clearTimeout(availabilityMsgTimeoutRef.current);
  }, [availabilityMessage, availabilityError]);

  // Populate forms on initial load or user change
  useEffect(() => {
    if (user) {
      /* ... (keep population logic) ... */
      setProfileData({ name: user.name || "", email: user.email || "" });
      if (isDoctor && user.doctorProfile) {
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
      }
    }
    // Don't clear messages here anymore
    clearError();
  }, [user, isDoctor, clearError]); // Removed message clearing

  // --- Handlers ---
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setProfileMessage("");
    setProfileError(""); // Clear messages on input change
  };
  const handleAvailabilityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStdAvailabilityData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setAvailabilityMessage("");
    setAvailabilityError(""); // Clear messages on input change
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError(""); // Clear before submit
    clearError();
    setLoadingProfile(true);
    console.log("Submitting profile update..."); // DEBUG
    try {
      const res = await axiosInstance.patch("/users/profile/me", {
        name: profileData.name,
        email: profileData.email,
      });
      console.log("Profile update SUCCESS"); // DEBUG
      setProfileError("");
      setProfileMessage("Profile updated successfully!"); // Set success
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to update profile.";
      console.error("Profile update FAILED:", errorMsg, err); // DEBUG
      setProfileMessage("");
      setProfileError(errorMsg); // Set error
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!isDoctor) return;
    setAvailabilityMessage("");
    setAvailabilityError(""); // Clear before submit
    setAvailabilityLoading(true);
    console.log("Submitting availability update..."); // DEBUG
    const { weekdayStartTime /*...*/ } = stdAvailabilityData; // Destructure all needed vars
    // Validation
    if (
      !weekdayStartTime ||
      !stdAvailabilityData.weekdayEndTime ||
      weekdayStartTime >= stdAvailabilityData.weekdayEndTime
    ) {
      setAvailabilityError("Valid weekday start/end times required.");
      setAvailabilityLoading(false);
      return;
    }
    if (
      stdAvailabilityData.worksWeekends &&
      (!stdAvailabilityData.weekendStartTime ||
        !stdAvailabilityData.weekendEndTime ||
        stdAvailabilityData.weekendStartTime >=
          stdAvailabilityData.weekendEndTime)
    ) {
      setAvailabilityError("Valid weekend start/end times required.");
      setAvailabilityLoading(false);
      return;
    }
    // Reconstruct array
    const newStandardAvailability = [];
    // ... reconstruction logic ...
    WEEKDAYS.forEach((day) => {
      newStandardAvailability.push({
        dayOfWeek: day,
        startTime: weekdayStartTime,
        endTime: stdAvailabilityData.weekdayEndTime,
      });
    });
    if (stdAvailabilityData.worksWeekends) {
      WEEKENDS.forEach((day) => {
        newStandardAvailability.push({
          dayOfWeek: day,
          startTime: stdAvailabilityData.weekendStartTime,
          endTime: stdAvailabilityData.weekendEndTime,
        });
      });
    }

    try {
      await axiosInstance.put("/doctors/availability/standard", {
        availabilitySlots: newStandardAvailability,
      });
      console.log("Availability update SUCCESS"); // DEBUG
      // Update Context
      if (user && user.doctorProfile) {
        const updatedUser = {
          ...user,
          doctorProfile: {
            ...user.doctorProfile,
            standardAvailability: newStandardAvailability,
          },
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      setAvailabilityError("");
      setAvailabilityMessage("Standard availability updated successfully!"); // Set success
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to save standard availability.";
      console.error("Availability update FAILED:", errorMsg, err); // DEBUG
      setAvailabilityMessage("");
      setAvailabilityError(errorMsg); // Set error
    } finally {
      setAvailabilityLoading(false);
    }
  };
  // --- End Handlers ---

  // --- Render Logic ---
  if (authLoading || !user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="user-profile-edit-container">
      {/* Profile Section */}
      <div className="profile-section">
        <h2>Edit Your Profile</h2>
        {/* Display messages */}
        {profileMessage && (
          <div className="message success">{profileMessage}</div>
        )}
        {profileError && <div className="message error">{profileError}</div>}
        {authError && !profileError && !profileMessage && (
          <div className="message error">{authError}</div>
        )}
        {/* ... rest of profile form ... */}
        <form onSubmit={handleProfileSubmit} className="profile-form">
          {" "}
          <div className="form-group">
            {" "}
            <label htmlFor="name">Name</label>{" "}
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              required
            />{" "}
          </div>{" "}
          <div className="form-group">
            {" "}
            <label htmlFor="email">Email</label>{" "}
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              required
            />{" "}
          </div>{" "}
          <button
            type="submit"
            className="submit-btn"
            disabled={loadingProfile}
          >
            {" "}
            {loadingProfile ? "Saving..." : "Update Profile"}{" "}
          </button>{" "}
        </form>
      </div>

      {/* Availability Sections */}
      {isDoctor && (
        <>
          {/* Standard Availability */}
          <div className="profile-section">
            <h4>Edit Standard Weekly Availability</h4>
            <p className="info-text">Set your default weekly working hours.</p>
            {/* Display messages */}
            {availabilityMessage && (
              <div className="message success">{availabilityMessage}</div>
            )}
            {availabilityError && (
              <div className="message error">{availabilityError}</div>
            )}
            {/* ... rest of availability form ... */}
            {availabilityLoading && <div>Loading/Saving...</div>}
            {!availabilityLoading && (
              <fieldset className="availability-fieldset">
                {" "}
                <legend>Default Weekly Hours</legend>{" "}
                <div className="form-group time-range">
                  {" "}
                  <label>Weekdays (Mon-Fri)</label>{" "}
                  <div>
                    {" "}
                    <input
                      type="time"
                      name="weekdayStartTime"
                      value={stdAvailabilityData.weekdayStartTime}
                      onChange={handleAvailabilityChange}
                      required
                    />{" "}
                    <span> to </span>{" "}
                    <input
                      type="time"
                      name="weekdayEndTime"
                      value={stdAvailabilityData.weekdayEndTime}
                      onChange={handleAvailabilityChange}
                      required
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="form-group checkbox-group">
                  {" "}
                  <input
                    type="checkbox"
                    id="worksWeekends"
                    name="worksWeekends"
                    checked={stdAvailabilityData.worksWeekends}
                    onChange={handleAvailabilityChange}
                  />{" "}
                  <label htmlFor="worksWeekends">
                    Work on Weekends (Sat-Sun)?
                  </label>{" "}
                </div>{" "}
                {stdAvailabilityData.worksWeekends && (
                  <div className="form-group time-range">
                    {" "}
                    <label>Weekends (Sat-Sun)</label>{" "}
                    <div>
                      {" "}
                      <input
                        type="time"
                        name="weekendStartTime"
                        value={stdAvailabilityData.weekendStartTime}
                        onChange={handleAvailabilityChange}
                        required={stdAvailabilityData.worksWeekends}
                      />{" "}
                      <span> to </span>{" "}
                      <input
                        type="time"
                        name="weekendEndTime"
                        value={stdAvailabilityData.weekendEndTime}
                        onChange={handleAvailabilityChange}
                        required={stdAvailabilityData.worksWeekends}
                      />{" "}
                    </div>{" "}
                  </div>
                )}{" "}
                <button
                  onClick={handleSaveAvailability}
                  disabled={availabilityLoading}
                  className="save-availability-btn submit-btn"
                >
                  {" "}
                  {availabilityLoading
                    ? "Saving..."
                    : "Save Standard Availability"}{" "}
                </button>{" "}
              </fieldset>
            )}
          </div>

          {/* Specific Date Calendar */}
          <div className="profile-section">
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
