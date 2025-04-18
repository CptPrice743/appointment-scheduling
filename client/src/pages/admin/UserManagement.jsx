// client/src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios"; // Make sure axios is installed (npm install axios)
import AuthContext from "../../context/AuthContext"; // Adjust path if needed
import "./UserManagement.css"; // Create this CSS file

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState(null); // Track which user's role is being edited
  const [selectedRole, setSelectedRole] = useState("");

  const { token } = useContext(AuthContext); // Get token for API requests

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"; // Use environment variable

  // --- Fetch users ---
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = {
        headers: {
          // Content-Type is not needed for GET request usually
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/admin/users`, config);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error("API did not return an array for users:", response.data);
        setUsers([]);
        setError("Received unexpected user data format from server.");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.code === "ERR_NETWORK") {
        setError("Connection failed fetching users. Is the server running?");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to fetch users. Are you logged in as an admin?"
        );
      }
      setUsers([]); // Clear users on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    if (token) {
      fetchUsers();
    } else {
      setError("Authentication token not found.");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Depend only on token for initial fetch

  // --- Action Handlers ---

  // Handler for Activate/Deactivate button
  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    if (
      window.confirm(
        `Are you sure you want to ${
          newStatus ? "activate" : "deactivate"
        } this user?`
      )
    ) {
      try {
        const config = {
          headers: {
            "Content-Type": "application/json", // Needed for PUT with body
            Authorization: `Bearer ${token}`,
          },
        };
        // *** CORRECTED URL for axios.put ***
        await axios.put(
          `${API_URL}/admin/users/${userId}/status`, // Correct template literal
          { isActive: newStatus }, // Request body
          config
        );
        // *** END CORRECTION ***

        // Update user list locally for immediate feedback
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, isActive: newStatus } : user
          )
        );
        alert(`User ${newStatus ? "activated" : "deactivated"} successfully.`);
      } catch (err) {
        console.error("Error updating user status:", err);
        alert(err.response?.data?.message || "Failed to update user status.");
      }
    }
  };

  // Handler for Delete button
  const handleDeleteUser = async (userId, userName) => {
    if (
      window.confirm(
        `ARE YOU SURE you want to DELETE user "${userName}"?\nThis will also delete all their appointments and cannot be undone.`
      )
    ) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`, // Content-Type not needed for DELETE
          },
        };
        // *** CORRECTED URL for axios.delete ***
        await axios.delete(
          `${API_URL}/admin/users/${userId}`, // Correct template literal
          config
        );
        // *** END CORRECTION ***

        // Remove user from list locally
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== userId)
        );
        alert(`User "${userName}" deleted successfully.`);
      } catch (err) {
        console.error("Error deleting user:", err);
        alert(err.response?.data?.message || "Failed to delete user.");
      }
    }
  };

  // Handler to start editing role
  const handleEditRoleClick = (user) => {
    setEditingRoleUserId(user._id);
    setSelectedRole(user.role);
  };

  // Handler to cancel editing role
  const handleCancelEditRole = () => {
    setEditingRoleUserId(null);
    setSelectedRole("");
  };

  // Handler for Role change dropdown selection
  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  // Handler to save the updated role
  const handleSaveRole = async (userId) => {
    if (!selectedRole) {
      alert("Please select a role.");
      return;
    }
    try {
      const config = {
        headers: {
          "Content-Type": "application/json", // Needed for PUT with body
          Authorization: `Bearer ${token}`,
        },
      };
      // *** CORRECTED URL for axios.put ***
      const response = await axios.put(
        `${API_URL}/admin/users/${userId}/role`, // Correct template literal
        { role: selectedRole }, // Request body
        config
      );
      // *** END CORRECTION ***

      // Update user list locally using data from response if needed, or just selectedRole
      const updatedUser = response.data.user; // Assuming backend returns updated user
      setUsers((prevUsers) =>
        prevUsers.map(
          (user) =>
            user._id === userId ? { ...user, role: updatedUser.role } : user // Use response data
          // Or simpler: user._id === userId ? { ...user, role: selectedRole } : user
        )
      );
      alert(`User role updated to ${selectedRole} successfully.`);
      setEditingRoleUserId(null); // Exit editing mode
      setSelectedRole("");
    } catch (err) {
      console.error("Error updating user role:", err);
      alert(err.response?.data?.message || "Failed to update user role.");
    }
  };

  // --- Render Logic ---

  if (isLoading)
    return <div className="loading status-message">Loading users...</div>; // Use status-message class for consistency
  if (error) return <div className="error-message status-message">{error}</div>; // Use status-message class

  return (
    <div className="user-management-container">
      <h2>User Management</h2>
      {/* Check if users array is valid and has length */}
      {!Array.isArray(users) || users.length === 0 ? (
        <div className="info-message status-message">No users found.</div> // Use status-message class
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Map users array */}
            {users.map((user) => (
              <tr
                key={user._id}
                className={!user.isActive ? "inactive-user" : ""} // Optional styling for inactive
              >
                {/* Name */}
                <td>{user.name || "N/A"}</td>
                {/* Email */}
                <td>{user.email || "N/A"}</td>
                {/* Role */}
                <td>
                  {editingRoleUserId === user._id ? (
                    <select value={selectedRole} onChange={handleRoleChange}>
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : // Display role capitalized
                  user.role ? (
                    user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  ) : (
                    "N/A"
                  )}
                </td>
                {/* Status */}
                <td>
                  {/* Removed status badge span */}
                  {user.isActive ? "Active" : "Inactive"}
                </td>
                {/* Joined Date */}
                <td>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                {/* Actions */}
                <td className="action-buttons">
                  {editingRoleUserId === user._id ? (
                    // Save/Cancel buttons when editing role
                    <>
                      <button
                        onClick={() => handleSaveRole(user._id)}
                        className="btn btn-save"
                      >
                        Save Role
                      </button>
                      <button
                        onClick={handleCancelEditRole}
                        className="btn btn-cancel"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    // Action buttons when not editing role
                    <>
                      {/* Activate/Deactivate Button */}
                      <button
                        onClick={() =>
                          handleToggleStatus(user._id, user.isActive)
                        }
                        className={`btn btn-status ${
                          user.isActive ? "btn-deactivate" : "btn-activate"
                        }`}
                        title={
                          user.isActive ? "Deactivate User" : "Activate User"
                        }
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      {/* Change Role Button */}
                      <button
                        onClick={() => handleEditRoleClick(user)}
                        className="btn btn-edit" // Use a consistent class if needed e.g., btn-primary or btn-info
                        title="Change Role"
                      >
                        Change Role
                      </button>
                      {/* Delete User Button */}
                      <button
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        className="btn btn-delete"
                        title="Delete User"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;
