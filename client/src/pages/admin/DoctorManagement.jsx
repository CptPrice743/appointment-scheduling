import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../../context/AuthContext";
import {
  FirstAidKit,
  Plus,
  PencilSimple,
  Trash,
  FloppyDisk,
  X,
  Clock,
  Stethoscope,
  WarningCircle,
  User,
} from "@phosphor-icons/react";

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
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Fetch doctors and potential users to link
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Fetch doctors
      const doctorsRes = await axios.get(`${API_URL}/admin/doctors`, config);
      if (Array.isArray(doctorsRes.data)) {
        setDoctors(doctorsRes.data);
      } else {
        console.error(
          "API did not return an array for doctors:",
          doctorsRes.data
        );
        setDoctors([]);
      }

      // Fetch all users to find potential candidates for linking
      const usersRes = await axios.get(`${API_URL}/admin/users`, config);
      if (Array.isArray(usersRes.data)) {
        // Filter users who are not admins and don't already have a doctor profile
        const potentialUsers = usersRes.data.filter(
          (user) =>
            user.role !== "admin" && !user.doctorProfile && user.isActive
        );
        setUsersWithoutProfile(potentialUsers);
      } else {
        console.error("API did not return an array for users:", usersRes.data);
        setUsersWithoutProfile([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch data. Ensure you are an admin."
      );
      // Clear lists on error
      setDoctors([]);
      setUsersWithoutProfile([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Depend only on token for initial load

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
      // Refresh data fully after adding
      fetchData();
      setIsAdding(false); // Hide form
      setFormData({
        userId: "",
        name: "",
        specialization: "",
        appointmentDuration: 30,
      }); // Reset form
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
      // IMPORTANT: Do NOT put userId in formData for edit, it cannot be changed
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
      // Only send fields that can be updated
      const updateData = {
        name: formData.name,
        specialization: formData.specialization,
        appointmentDuration: formData.appointmentDuration,
      };

      const response = await axios.put(
        `${API_URL}/admin/doctors/${editingDoctor._id}`,
        updateData,
        config
      );

      // Update the list locally with the returned doctor data
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
        await axios.delete(`${API_URL}/admin/doctors/${doctorId}`, config);
        // Refresh data fully after deleting
        fetchData();
        alert(`Doctor "${doctorName}" deleted successfully.`);
      } catch (err) {
        console.error("Error deleting doctor:", err);
        alert(err.response?.data?.message || "Failed to delete doctor.");
      }
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="loading status-message min-h-[50vh] flex items-center justify-center text-sm text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
        Loading practitioner directory...
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
    <div className="doctor-management-container w-full max-w-[1650px] mx-auto py-8 sm:py-10 px-4 sm:px-8 lg:px-12 space-y-8 animate-materialize">
      {/* Header Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FirstAidKit className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              Physician & Practice Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure practicing clinicians, medical disciplines, and standard appointment consultation slots.
          </p>
        </div>

        {!isAdding && !editingDoctor && (
          <button
            onClick={() => {
              setIsAdding(true);
              setFormData({
                userId: "",
                name: "",
                specialization: "",
                appointmentDuration: 30,
              });
            }}
            className="btn btn-add-new inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs btn-press cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Doctor
          </button>
        )}
      </div>

      {/* Add / Edit Form Panel */}
      {(isAdding || editingDoctor) && (
        <div className="form-section bg-white dark:bg-slate-900 rounded-2xl border border-teal-500/30 dark:border-teal-500/20 p-6 shadow-sm animate-materialize">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-heading font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              {editingDoctor ? `Edit Profile: ${editingDoctor.name}` : "Create New Provider Profile"}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={editingDoctor ? handleUpdateDoctor : handleAddDoctor}
            className="space-y-4"
          >
            {isAdding && (
              <div className="form-group">
                <label
                  htmlFor="userId"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Link to User Account:
                </label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleUserSelectChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                >
                  <option value="">Select User</option>
                  {usersWithoutProfile.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {usersWithoutProfile.length === 0 && !isLoading && (
                  <p className="info-text text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                    <WarningCircle className="w-3.5 h-3.5" />
                    No unassigned users available. Please register or invite a new account first.
                  </p>
                )}
              </div>
            )}

            {editingDoctor && (
              <div className="form-group p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Linked Account
                </label>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {editingDoctor.userId?.name || "N/A"} ({editingDoctor.userId?.email || "N/A"})
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-group">
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Doctor Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="specialization"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Specialization
                </label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="appointmentDuration"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Slot Duration (mins)
                </label>
                <input
                  type="number"
                  id="appointmentDuration"
                  name="appointmentDuration"
                  value={formData.appointmentDuration}
                  onChange={handleInputChange}
                  required
                  min="5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="form-actions flex items-center gap-2.5 pt-3">
              <button
                type="submit"
                className="btn btn-save px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors btn-press cursor-pointer"
              >
                <FloppyDisk className="w-4 h-4" />
                {editingDoctor ? "Update Doctor" : "Add Doctor"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-cancel px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-semibold text-slate-900 dark:text-white">
            Registered Practitioners
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {doctors.length} Active Providers
          </span>
        </div>

        {!Array.isArray(doctors) || doctors.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 text-sm">
            No doctors registered yet.
          </div>
        ) : (
          <div className="doctors-table-container bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="doctors-table w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Physician Name</th>
                    <th className="py-3.5 px-4">Specialization</th>
                    <th className="py-3.5 px-4">Linked User Account</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-800 dark:text-slate-200">
                  {doctors.map((doctor) => (
                    <tr
                      key={doctor._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Name */}
                      <td data-label="Name" className="py-4 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold flex items-center justify-center text-xs border border-teal-200/80 dark:border-teal-800/60">
                            Dr
                          </div>
                          <span>{doctor.name}</span>
                        </div>
                      </td>

                      {/* Specialization */}
                      <td data-label="Specialization" className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60">
                          {doctor.specialization}
                        </span>
                      </td>

                      {/* Linked User */}
                      <td data-label="Linked User" className="py-4 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {doctor.userId
                          ? `${doctor.userId.name} (${doctor.userId.email})`
                          : "N/A"}
                      </td>

                      {/* Appt Duration */}
                      <td data-label="Appt Duration" className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {doctor.appointmentDuration} mins
                        </span>
                      </td>

                      {/* Actions */}
                      <td data-label="Actions" className="action-buttons-cell py-4 px-4 sm:px-6 text-right">
                        <div className="action-buttons inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(doctor)}
                            className="btn btn-edit px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                          >
                            <PencilSimple className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteDoctor(doctor._id, doctor.name)
                            }
                            className="btn btn-delete px-2 py-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium transition-colors"
                            title="Delete Doctor"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;
