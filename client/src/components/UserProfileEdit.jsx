import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const UserProfileEdit = () => {
  // Correctly destructure setUser from the context
  const {
    user,
    axiosInstance,
    isLoading: authLoading,
    error: authError,
    clearError,
    setUser,
  } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    // phone: '', // Add if you add phone to User model
    // currentPassword: '', // For password change
    // newPassword: '',
    // confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // For success messages
  const [error, setError] = useState(""); // For form-specific errors

  // Populate form with current user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        // phone: user.phone || '', // If phone exists on user object
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear messages on input change
    setMessage("");
    setError("");
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Clear previous messages before attempting submission
    setMessage("");
    setError("");
    clearError();

    // Basic frontend validation (e.g., password match if changing)
    // if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
    //     setError("New passwords do not match.");
    //     return;
    // }

    setLoading(true);
    const updateData = {
      name: formData.name,
      email: formData.email,
      // phone: formData.phone // If phone exists
      // currentPassword: formData.currentPassword, // If changing password
      // newPassword: formData.newPassword,
    };

    // Remove empty fields if not changing password
    // if (!updateData.newPassword) {
    //     delete updateData.currentPassword;
    //     delete updateData.newPassword;
    // }

    try {
      const res = await axiosInstance.patch("/users/profile/me", updateData);

      // Clear any previous error messages *before* setting success message
      setError("");
      setMessage("Profile updated successfully!");

      // Update the user in AuthContext state and local storage using the correct function
      setUser(res.data); // Use setUser here
      localStorage.setItem("user", JSON.stringify(res.data));

      // Clear password fields after successful update
      // setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
    } catch (err) {
      console.error("Error updating profile:", err); // Keep this log
      // Clear any previous success message *before* setting error message
      setMessage("");
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="appointment-form-container">
      <h2>Edit Your Profile</h2>

      {/* Display only one message at a time */}
      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}
      {/* Display auth context errors separately if needed, or rely on form error */}
      {/* {authError && !error && <div className="message error">{authError}</div>} */}

      <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        {/* Add phone input if applicable */}
        {/* <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                </div> */}

        {/* Add Password Change Section if implementing */}
        {/* ... password fields ... */}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Saving..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default UserProfileEdit;
