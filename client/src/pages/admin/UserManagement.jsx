import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../../context/AuthContext";
import {
  Users,
  ShieldCheck,
  UserSwitch,
  Trash,
  CheckCircle,
  XCircle,
  WarningCircle,
  FloppyDisk,
  X,
} from "@phosphor-icons/react";

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
        await axios.put(
          `${API_URL}/admin/users/${userId}/status`,
          { isActive: newStatus }, // Request body
          config
        );

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
        await axios.delete(`${API_URL}/admin/users/${userId}`, config);

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
      const response = await axios.put(
        `${API_URL}/admin/users/${userId}/role`,
        { role: selectedRole }, // Request body
        config
      );

      // Update user list locally using data from response if needed, or just selectedRole
      const updatedUser = response.data.user; // Assuming backend returns updated user
      setUsers((prevUsers) =>
        prevUsers.map(
          (user) =>
            user._id === userId ? { ...user, role: updatedUser.role } : user // Use response data
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

  if (isLoading) {
    return (
      <div className="loading status-message min-h-[50vh] flex items-center justify-center text-sm text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="error-message status-message p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <WarningCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container w-full max-w-[1650px] mx-auto py-8 sm:py-10 px-4 sm:px-8 lg:px-12 space-y-8 animate-materialize">
      {/* Header Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              User Directory & Access Control
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage account privileges, clinical roles, and active platform memberships.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
          <span>Total Records:</span>
          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
            {users.length}
          </span>
        </div>
      </div>

      {!Array.isArray(users) || users.length === 0 ? (
        <div className="info-message status-message bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 text-sm">
          No user accounts found on platform.
        </div>
      ) : (
        <div className="users-table-container bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="users-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-800 dark:text-slate-200">
                {users.map((user) => {
                  const roleBadgeStyles = {
                    admin: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
                    doctor: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/60",
                    patient: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800/60",
                  }[user.role] || "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

                  return (
                    <tr
                      key={user._id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        !user.isActive ? "inactive-user opacity-60 bg-slate-50/30 dark:bg-slate-900/40" : ""
                      }`}
                    >
                      {/* Name */}
                      <td data-label="Name" className="py-4 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-center text-xs">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <span>{user.name || "N/A"}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td data-label="Email" className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {user.email || "N/A"}
                      </td>

                      {/* Role */}
                      <td data-label="Role" className="py-4 px-4">
                        {editingRoleUserId === user._id ? (
                          <select
                            value={selectedRole}
                            onChange={handleRoleChange}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                          >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${roleBadgeStyles}`}
                          >
                            {user.role
                              ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                              : "N/A"}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td data-label="Status" className="py-4 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td data-label="Joined" className="py-4 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>

                      {/* Actions */}
                      <td data-label="Actions" className="action-buttons-cell py-4 px-4 sm:px-6 text-right">
                        <div className="action-buttons inline-flex items-center justify-end gap-1.5">
                          {editingRoleUserId === user._id ? (
                            <>
                              <button
                                onClick={() => handleSaveRole(user._id)}
                                className="btn btn-save px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <FloppyDisk className="w-3.5 h-3.5" />
                                Save Role
                              </button>
                              <button
                                onClick={handleCancelEditRole}
                                className="btn btn-cancel px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Activate/Deactivate Button */}
                              <button
                                onClick={() =>
                                  handleToggleStatus(user._id, user.isActive)
                                }
                                className={`btn btn-status px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                  user.isActive
                                    ? "btn-deactivate bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60"
                                    : "btn-activate bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60"
                                }`}
                                title={
                                  user.isActive
                                    ? "Deactivate User"
                                    : "Activate User"
                                }
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </button>

                              {/* Change Role Button */}
                              <button
                                onClick={() => handleEditRoleClick(user)}
                                className="btn btn-edit px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors"
                                title="Change Role"
                              >
                                Change Role
                              </button>

                              {/* Delete User Button */}
                              <button
                                onClick={() =>
                                  handleDeleteUser(user._id, user.name)
                                }
                                className="btn btn-delete px-2 py-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium transition-colors"
                                title="Delete User"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
