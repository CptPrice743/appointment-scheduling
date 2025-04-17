// client/src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios"; // Make sure axios is installed (npm install axios)
import AuthContext from "../../context/AuthContext"; // Adjust path
import "./UserManagement.css"; // Create this CSS file

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState(null); // Track which user's role is being edited
  const [selectedRole, setSelectedRole] = useState("");

  const { token } = useContext(AuthContext); // Get token for API requests

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api"; // Use environment variable

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await axios.get(`${API_URL}/admin/users`, config);
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(
          err.response?.data?.message ||
            "Failed to fetch users. Are you logged in as an admin?"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    } else {
      setError("Authentication token not found.");
      setIsLoading(false);
    }
  }, [token, API_URL]); // Re-fetch if token changes

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
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };
        await axios.put(
          `<span class="math-inline">\{API\_URL\}/admin/users/</span>{userId}/status`,
          { isActive: newStatus },
          config
        );
        // Update user list locally
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
            Authorization: `Bearer ${token}`,
          },
        };
        await axios.delete(
          `<span class="math-inline">\{API\_URL\}/admin/users/</span>{userId}`,
          config
        );
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

  // Handler for Role change dropdown
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put(
        `<span class="math-inline">\{API\_URL\}/admin/users/</span>{userId}/role`,
        { role: selectedRole },
        config
      );
      // Update user list locally
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: selectedRole } : user
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

  if (isLoading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="user-management-container">
      <h2>User Management</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
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
            {users.map((user) => (
              <tr
                key={user._id}
                className={!user.isActive ? "inactive-user" : ""}
              >
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  {editingRoleUserId === user._id ? (
                    <select value={selectedRole} onChange={handleRoleChange}>
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td>
                  <span
                    className={`status-badge status-${
                      user.isActive ? "active" : "inactive"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="action-buttons">
                  {editingRoleUserId === user._id ? (
                    <>
                      <button
                        onClick={() => handleSaveRole(user._id)}
                        className="btn btn-save"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEditRole}
                        className="btn btn-cancel"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
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
                      <button
                        onClick={() => handleEditRoleClick(user)}
                        className="btn btn-edit"
                        title="Change Role"
                      >
                        Change Role
                      </button>
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
