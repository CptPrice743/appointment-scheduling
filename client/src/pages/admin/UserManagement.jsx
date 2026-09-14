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
  CalendarBlank,
  Clock,
  Sparkle,
} from "@phosphor-icons/react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  const { token } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = {
        headers: {
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
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    } else {
      setError("Authentication token not found.");
      setIsLoading(false);
    }
  }, [token]);

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
          `${API_URL}/admin/users/${userId}/status`,
          { isActive: newStatus },
          config
        );

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
        await axios.delete(`${API_URL}/admin/users/${userId}`, config);

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

  const handleEditRoleClick = (user) => {
    setEditingRoleUserId(user._id);
    setSelectedRole(user.role);
  };

  const handleCancelEditRole = () => {
    setEditingRoleUserId(null);
    setSelectedRole("");
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

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
        `${API_URL}/admin/users/${userId}/role`,
        { role: selectedRole },
        config
      );

      const updatedUser = response.data.user;
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: updatedUser.role } : user
        )
      );
      alert(`User role updated to ${selectedRole} successfully.`);
      setEditingRoleUserId(null);
      setSelectedRole("");
    } catch (err) {
      console.error("Error updating user role:", err);
      alert(err.response?.data?.message || "Failed to update user role.");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Admin
          </span>
        );
      case "doctor":
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Doctor
          </span>
        );
      case "patient":
      default:
        return (
          <span className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Patient
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-mono-code text-xs text-zinc-500 dark:text-zinc-400">
          Syncing user directory and authorizations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono-code font-medium flex items-center gap-2">
          <WarningCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 animate-materialize space-y-8">
      {/* Header Area */}
      <div className="doppelrand-shell">
        <div className="doppelrand-core p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="specular-hairline" />
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Users size={24} className="text-sky-600 dark:text-sky-400" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 dark:text-white tracking-tight">
                User Directory & Access Control
              </h1>
            </div>
            <p className="font-body text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Manage account privileges, clinical roles, and active platform memberships.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] text-xs font-mono-code text-zinc-600 dark:text-zinc-400 w-fit">
            <span>Total Records:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">
              {users.length}
            </span>
          </div>
        </div>
      </div>

      {!Array.isArray(users) || users.length === 0 ? (
        <div className="doppelrand-shell">
          <div className="doppelrand-core p-12 text-center text-zinc-400 font-mono-code text-xs">
            No user accounts found on platform.
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View (md:hidden) — 100% responsive, never overflows */}
          <div className="md:hidden space-y-4">
            {users.map((user) => {
              const isEditingThis = editingRoleUserId === user._id;

              return (
                <div key={user._id} className="doppelrand-shell">
                  <div className="doppelrand-core p-5 space-y-4">
                    <div className="specular-hairline" />

                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-sm font-display flex items-center justify-center shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-bold text-zinc-950 dark:text-white truncate">
                            {user.name || "N/A"}
                          </h3>
                          <p className="text-xs font-mono-code text-zinc-400 truncate">
                            {user.email || "N/A"}
                          </p>
                        </div>
                      </div>

                      {user.isActive ? (
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono-code bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono-code bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Metadata Strip */}
                    <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.05] grid grid-cols-2 gap-2 text-xs font-mono-code">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Role</span>
                        {isEditingThis ? (
                          <select
                            value={selectedRole}
                            onChange={handleRoleChange}
                            className="mt-1 w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-[#131720] text-zinc-950 dark:text-white text-xs"
                          >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Joined</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex flex-wrap items-center justify-end gap-2">
                      {isEditingThis ? (
                        <>
                          <button
                            onClick={() => handleSaveRole(user._id)}
                            className="h-8 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs active:scale-[0.96] transition-all cursor-pointer"
                          >
                            <FloppyDisk size={14} />
                            <span>Save Role</span>
                          </button>
                          <button
                            onClick={handleCancelEditRole}
                            className="h-8 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 text-xs font-semibold inline-flex items-center gap-1 active:scale-[0.96] transition-all cursor-pointer"
                          >
                            <X size={14} />
                            <span>Cancel</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            className={`h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1 border transition-all active:scale-[0.96] cursor-pointer ${
                              user.isActive
                                ? "bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleEditRoleClick(user)}
                            className="h-8 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 text-xs font-semibold inline-flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-white/[0.06] active:scale-[0.96] transition-all cursor-pointer"
                          >
                            <span>Change Role</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="h-8 px-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center justify-center active:scale-[0.96] transition-all cursor-pointer"
                            title="Delete User"
                          >
                            <Trash size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block doppelrand-shell">
            <div className="doppelrand-core p-0 overflow-hidden">
              <div className="specular-hairline" />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      <th className="py-4 px-6 font-semibold">Name</th>
                      <th className="py-4 px-4 font-semibold">Email</th>
                      <th className="py-4 px-4 font-semibold">Role</th>
                      <th className="py-4 px-4 font-semibold">Status</th>
                      <th className="py-4 px-4 font-semibold">Joined</th>
                      <th className="py-4 px-6 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05] text-xs font-body">
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className={`hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors ${
                          !user.isActive ? "opacity-60 bg-zinc-50/40 dark:bg-white/[0.01]" : ""
                        }`}
                      >
                        {/* Name */}
                        <td className="py-4 px-6 font-medium text-zinc-950 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center font-display">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <span>{user.name || "N/A"}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 font-mono-code text-zinc-500 dark:text-zinc-400">
                          {user.email || "N/A"}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          {editingRoleUserId === user._id ? (
                            <select
                              value={selectedRole}
                              onChange={handleRoleChange}
                              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-[#131720] text-zinc-950 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                            >
                              <option value="patient">Patient</option>
                              <option value="doctor">Doctor</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            getRoleBadge(user.role)
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 font-mono-code">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-4 font-mono-code text-[11px] text-zinc-400">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {editingRoleUserId === user._id ? (
                              <>
                                <button
                                  onClick={() => handleSaveRole(user._id)}
                                  className="h-8 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs active:scale-[0.96] transition-all cursor-pointer"
                                >
                                  <FloppyDisk size={14} />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={handleCancelEditRole}
                                  className="h-8 px-2.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 text-xs font-semibold inline-flex items-center gap-1 active:scale-[0.96] transition-all cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    handleToggleStatus(user._id, user.isActive)
                                  }
                                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] border cursor-pointer ${
                                    user.isActive
                                      ? "bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                      : "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  }`}
                                >
                                  {user.isActive ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  onClick={() => handleEditRoleClick(user)}
                                  className="h-8 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-semibold active:scale-[0.96] transition-all cursor-pointer"
                                >
                                  Change Role
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteUser(user._id, user.name)
                                  }
                                  className="h-8 px-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold active:scale-[0.96] transition-all cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
