import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../../context/AuthContext"; // Adjust path
import "./DoctorManagement.css"; // Create this CSS file

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [usersWithoutProfile, setUsersWithoutProfile] = useState([]); // For Add Doctor dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false); // Toggle add form visibility
  const [editingDoctor, setEditingDoctor] = useState(null); // Track doctor being edited

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    specialization: "",
    appointmentDuration: 30, // Default duration
  });

  const { token } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

  // Fetch doctors and potential users to link
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Fetch doctors
      const doctorsRes = await axios.get(`${API_URL}/admin/doctors`, config);
      setDoctors(doctorsRes.data);

      // Fetch all users to find potential candidates for linking
      const usersRes = await axios.get(`${API_URL}/admin/users`, config);
      // Filter users who are not admins and don't already have a doctor profile
      const potentialUsers = usersRes.data.filter(
        (user) => user.role !== "admin" && !user.doctorProfile && user.isActive
      );
      setUsersWithoutProfile(potentialUsers);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch data. Ensure you are an admin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      setError("Authentication token not found.");
      setIsLoading(false);
    }
  }, [token, API_URL]);

  // Handle input changes for add/edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle user selection for linking
  const handleUserSelectChange = (e) => {
    const selectedUserId = e.target.value;
    const selectedUser = usersWithoutProfile.find(
      (u) => u._id === selectedUserId
    );
    setFormData((prev) => ({
      ...prev,
      userId: selectedUserId,
      name: selectedUser ? selectedUser.name : "", // Pre-fill name from user
    }));
  };

  // Handle Add Doctor submission
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!formData.userId || !formData.name || !formData.specialization) {
      alert("Please fill in User, Name, and Specialization.");
      return;
    }
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const response = await axios.post(
        `${API_URL}/admin/doctors`,
        formData,
        config
      );
      setDoctors((prev) => [...prev, response.data.doctor]); // Add new doctor to list
      setIsAdding(false); // Hide form
      setFormData({
        userId: "",
        name: "",
        specialization: "",
        appointmentDuration: 30,
      }); // Reset form
      fetchData(); // Refresh data to update user list etc.
      alert("Doctor added successfully!");
    } catch (err) {
      console.error("Error adding doctor:", err);
      alert(err.response?.data?.message || "Failed to add doctor.");
    }
  };

  // Handle Edit button click
  const handleEditClick = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      userId: doctor.userId._id, // Cannot change linked user here
      name: doctor.name,
      specialization: doctor.specialization,
      appointmentDuration: doctor.appointmentDuration,
    });
    setIsAdding(false); // Ensure add form is hidden if edit is clicked
  };

  // Handle Update Doctor submission
  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoctor || !formData.name || !formData.specialization) {
      alert("Name and Specialization are required.");
      return;
    }
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      // Only send fields that can be updated (name, specialization, duration)
      const updateData = {
        name: formData.name,
        specialization: formData.specialization,
        appointmentDuration: formData.appointmentDuration,
        // Add availability updates here if implementing
      };
      const response = await axios.put(
        `<span class="math-inline">\{API\_URL\}/admin/doctors/</span>{editingDoctor._id}`,
        updateData,
        config
      );
      setDoctors((prev) =>
        prev.map((doc) =>
          doc._id === editingDoctor._id ? response.data.doctor : doc
        )
      );
      setEditingDoctor(null); // Exit editing mode
      setFormData({
        userId: "",
        name: "",
        specialization: "",
        appointmentDuration: 30,
      }); // Reset form
      alert("Doctor updated successfully!");
    } catch (err) {
      console.error("Error updating doctor:", err);
      alert(err.response?.data?.message || "Failed to update doctor.");
    }
  };

  // Handle Cancel Edit/Add
  const handleCancel = () => {
    setIsAdding(false);
    setEditingDoctor(null);
    setFormData({
      userId: "",
      name: "",
      specialization: "",
      appointmentDuration: 30,
    });
  };

  // Handle Delete Doctor
  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (
      window.confirm(
        `ARE YOU SURE you want to DELETE doctor "${doctorName}"?\nThis will cancel their future appointments and unlink the user.`
      )
    ) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(
          `<span class="math-inline">\{API\_URL\}/admin/doctors/</span>{doctorId}`,
          config
        );
        setDoctors((prev) => prev.filter((doc) => doc._id !== doctorId));
        fetchData(); // Refresh users list as well
        alert(`Doctor "${doctorName}" deleted successfully.`);
      } catch (err) {
        console.error("Error deleting doctor:", err);
        alert(err.response?.data?.message || "Failed to delete doctor.");
      }
    }
  };

  if (isLoading) return <div className="loading">Loading doctors...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="doctor-management-container">
      <h2>Doctor Management</h2>

      {/* Add/Edit Form Section */}
      {!isAdding && !editingDoctor && (
        <button onClick={() => setIsAdding(true)} className="btn btn-add-new">
          Add New Doctor
        </button>
      )}

      {(isAdding || editingDoctor) && (
        <div className="form-section">
          <h3>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</h3>
          <form onSubmit={editingDoctor ? handleUpdateDoctor : handleAddDoctor}>
            {isAdding && ( // Only show User selection when adding
              <div className="form-group">
                <label htmlFor="userId">Link to User:</label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleUserSelectChange} // Use specific handler
                  required
                >
                  <option value="">-- Select User --</option>
                  {usersWithoutProfile.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {usersWithoutProfile.length === 0 && (
                  <p className="info-text">
                    No available users found to link. Create a new user first.
                  </p>
                )}
              </div>
            )}
            {editingDoctor && ( // Show linked user when editing (read-only)
              <div className="form-group">
                <label>Linked User:</label>
                <p>
                  {editingDoctor.userId.name} ({editingDoctor.userId.email})
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Doctor Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="specialization">Specialization:</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="appointmentDuration">
                Appt. Duration (mins):
              </label>
              <input
                type="number"
                id="appointmentDuration"
                name="appointmentDuration"
                value={formData.appointmentDuration}
                onChange={handleInputChange}
                required
                min="5"
              />
            </div>
            {/* Add fields for availability management later if needed */}

            <div className="form-actions">
              <button type="submit" className="btn btn-save">
                {editingDoctor ? "Update Doctor" : "Add Doctor"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors List Section */}
      <h3>Existing Doctors</h3>
      {doctors.length === 0 ? (
        <p>No doctors found.</p>
      ) : (
        <table className="doctors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Linked User</th>
              <th>Appt Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor._id}>
                <td>{doctor.name}</td>
                <td>{doctor.specialization}</td>
                {/* Safely access populated user details */}
                <td>
                  {doctor.userId
                    ? `<span class="math-inline">\{doctor\.userId\.name\} \(</span>{doctor.userId.email})`
                    : "N/A"}
                </td>
                <td>{doctor.appointmentDuration} mins</td>
                <td className="action-buttons">
                  <button
                    onClick={() => handleEditClick(doctor)}
                    className="btn btn-edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDoctor(doctor._id, doctor.name)}
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                  {/* Add button to manage availability later */}
                  {/* <button className="btn btn-manage-availability">Availability</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DoctorManagement;
