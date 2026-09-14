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
  EnvelopeSimple,
} from "@phosphor-icons/react";

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [usersWithoutProfile, setUsersWithoutProfile] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    specialization: "",
    appointmentDuration: 30,
  });

  const { token } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const doctorsRes = await axios.get(`${API_URL}/admin/doctors`, config);
      if (Array.isArray(doctorsRes.data)) {
        setDoctors(doctorsRes.data);
      } else {
        console.error("API did not return an array for doctors:", doctorsRes.data);
        setDoctors([]);
      }

      const usersRes = await axios.get(`${API_URL}/admin/users`, config);
      if (Array.isArray(usersRes.data)) {
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
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSelectChange = (e) => {
    const selectedUserId = e.target.value;
    const selectedUser = usersWithoutProfile.find(
      (u) => u._id === selectedUserId
    );
    setFormData((prev) => ({
      ...prev,
      userId: selectedUserId,
      name: selectedUser ? selectedUser.name : "",
    }));
  };

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
      await axios.post(`${API_URL}/admin/doctors`, formData, config);
      fetchData();
      setIsAdding(false);
      setFormData({
        userId: "",
        name: "",
        specialization: "",
        appointmentDuration: 30,
      });
      alert("Doctor added successfully!");
    } catch (err) {
      console.error("Error adding doctor:", err);
      alert(err.response?.data?.message || "Failed to add doctor.");
    }
  };

  const handleEditClick = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      appointmentDuration: doctor.appointmentDuration,
    });
    setIsAdding(false);
  };

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

      setDoctors((prev) =>
        prev.map((doc) =>
          doc._id === editingDoctor._id ? response.data.doctor : doc
        )
      );
      setEditingDoctor(null);
      setFormData({
        userId: "",
        name: "",
        specialization: "",
        appointmentDuration: 30,
      });
      alert("Doctor updated successfully!");
    } catch (err) {
      console.error("Error updating doctor:", err);
      alert(err.response?.data?.message || "Failed to update doctor.");
    }
  };

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

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (
      window.confirm(
        `ARE YOU SURE you want to DELETE doctor "${doctorName}"?\nThis will cancel their future appointments and unlink the user.`
      )
    ) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`${API_URL}/admin/doctors/${doctorId}`, config);
        fetchData();
        alert(`Doctor "${doctorName}" deleted successfully.`);
      } catch (err) {
        console.error("Error deleting doctor:", err);
        alert(err.response?.data?.message || "Failed to delete doctor.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-mono-code text-xs text-zinc-500 dark:text-zinc-400">
          Loading clinical provider ledger...
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
              <FirstAidKit size={24} className="text-sky-600 dark:text-sky-400" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 dark:text-white tracking-tight">
                Physician & Practice Management
              </h1>
            </div>
            <p className="font-body text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
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
              className="h-9 px-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs active:scale-[0.97] transition-all cursor-pointer w-fit"
            >
              <Plus size={15} weight="bold" />
              <span>Add New Doctor</span>
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Form Panel */}
      {(isAdding || editingDoctor) && (
        <div className="doppelrand-shell animate-materialize">
          <div className="doppelrand-core p-6 sm:p-8">
            <div className="specular-hairline" />

            <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-100 dark:border-white/[0.06]">
              <h3 className="font-display font-semibold text-base text-zinc-950 dark:text-white flex items-center gap-2">
                <Stethoscope size={18} className="text-sky-600 dark:text-sky-400" />
                <span>{editingDoctor ? `Edit Profile: ${editingDoctor.name}` : "Create New Provider Profile"}</span>
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={editingDoctor ? handleUpdateDoctor : handleAddDoctor}
              className="space-y-4"
            >
              {isAdding && (
                <div>
                  <label
                    htmlFor="userId"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Link to User Account:
                  </label>
                  <select
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleUserSelectChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select User</option>
                    {usersWithoutProfile.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  {usersWithoutProfile.length === 0 && !isLoading && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1 font-mono-code">
                      <WarningCircle size={14} />
                      <span>No unassigned users available. Register a new user account first.</span>
                    </p>
                  )}
                </div>
              )}

              {editingDoctor && (
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.05]">
                  <label className="block text-[10px] uppercase font-mono-code tracking-wider text-zinc-400 mb-0.5">
                    Linked User Account
                  </label>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {editingDoctor.userId?.name || "N/A"} ({editingDoctor.userId?.email || "N/A"})
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="specialization"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="appointmentDuration"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs active:scale-[0.97] transition-all cursor-pointer"
                >
                  <FloppyDisk size={15} />
                  <span>{editingDoctor ? "Update Doctor" : "Add Doctor"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-9 px-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <X size={15} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Directory Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-zinc-950 dark:text-white">
            Registered Practitioners
          </h2>
          <span className="font-mono-code text-xs text-zinc-400">
            {doctors.length} Active Providers
          </span>
        </div>

        {!Array.isArray(doctors) || doctors.length === 0 ? (
          <div className="doppelrand-shell">
            <div className="doppelrand-core p-12 text-center text-zinc-400 font-mono-code text-xs">
              No doctors registered yet.
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View (md:hidden) */}
            <div className="md:hidden space-y-4">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="doppelrand-shell">
                  <div className="doppelrand-core p-5 space-y-4">
                    <div className="specular-hairline" />

                    {/* Doctor Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-sm font-display flex items-center justify-center shrink-0">
                          {doctor.name ? doctor.name.replace(/^Dr\.\s*/i, "").charAt(0) : "D"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-bold text-zinc-950 dark:text-white truncate">
                            {doctor.name}
                          </h3>
                          <p className="text-xs text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1 truncate">
                            <Stethoscope size={13} className="shrink-0" />
                            <span>{doctor.specialization}</span>
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono-code bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        <Clock size={12} />
                        <span>{doctor.appointmentDuration}m</span>
                      </span>
                    </div>

                    {/* Linked User Strip */}
                    <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.05] text-xs font-mono-code">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5">
                        Linked User Account
                      </span>
                      <div className="text-zinc-800 dark:text-zinc-200 truncate">
                        {doctor.userId ? (
                          <span>{doctor.userId.name} ({doctor.userId.email})</span>
                        ) : (
                          <span className="text-rose-500 italic">Unlinked Record</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(doctor)}
                        className="h-8 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.96] transition-all cursor-pointer"
                      >
                        <PencilSimple size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doctor._id, doctor.name)}
                        className="h-8 px-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center justify-center active:scale-[0.96] transition-all cursor-pointer"
                        title="Delete Doctor"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block doppelrand-shell">
              <div className="doppelrand-core p-0 overflow-hidden">
                <div className="specular-hairline" />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        <th className="py-4 px-6 font-semibold">Physician Name</th>
                        <th className="py-4 px-4 font-semibold">Specialization</th>
                        <th className="py-4 px-4 font-semibold">Linked User Account</th>
                        <th className="py-4 px-4 font-semibold">Slot Duration</th>
                        <th className="py-4 px-6 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05] text-xs font-body">
                      {doctors.map((doctor) => (
                        <tr
                          key={doctor._id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Name */}
                          <td className="py-4 px-6 font-medium text-zinc-950 dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center font-display">
                                {doctor.name
                                  ? doctor.name.replace(/^Dr\.\s*/i, "").charAt(0)
                                  : "D"}
                              </div>
                              <span>{doctor.name}</span>
                            </div>
                          </td>

                          {/* Specialization */}
                          <td className="py-4 px-4 font-medium text-sky-600 dark:text-sky-400">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[11px] font-semibold">
                              {doctor.specialization}
                            </span>
                          </td>

                          {/* Linked User */}
                          <td className="py-4 px-4 font-mono-code text-zinc-500 dark:text-zinc-400">
                            {doctor.userId ? (
                              <div>
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                  {doctor.userId.name}
                                </span>{" "}
                                <span className="text-[11px] text-zinc-400">
                                  ({doctor.userId.email})
                                </span>
                              </div>
                            ) : (
                              <span className="text-rose-500 italic">Unlinked Record</span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-4 px-4 font-mono-code text-zinc-700 dark:text-zinc-300">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={13} className="text-zinc-400" />
                              <span>{doctor.appointmentDuration} mins</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditClick(doctor)}
                                className="h-8 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-semibold inline-flex items-center gap-1 active:scale-[0.96] transition-all cursor-pointer"
                              >
                                <PencilSimple size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDoctor(doctor._id, doctor.name)
                                }
                                className="h-8 px-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold active:scale-[0.96] transition-all cursor-pointer"
                                title="Delete Doctor"
                              >
                                <Trash size={14} />
                              </button>
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
    </div>
  );
};

export default DoctorManagement;
