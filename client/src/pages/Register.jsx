import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";
import {
  User,
  EnvelopeSimple,
  LockKey,
  Stethoscope,
  Clock,
  ArrowUpRight,
  SpinnerGap,
  FirstAidKit,
  CheckCircle,
} from "@phosphor-icons/react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    specialization: "",
    appointmentDuration: "30",
    weekdayStartTime: "09:00",
    weekdayEndTime: "17:00",
    worksWeekends: false,
    weekendStartTime: "10:00",
    weekendEndTime: "14:00",
  });

  const [formError, setFormError] = useState("");

  const {
    register,
    isAuthenticated,
    error: authError,
    clearError,
    isLoading,
  } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearError();
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setFormError("");

    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      specialization,
      appointmentDuration,
      weekdayStartTime,
      weekdayEndTime,
      worksWeekends,
      weekendStartTime,
      weekendEndTime,
    } = formData;

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    const registrationData = { name, email, password, role };

    if (role === "doctor") {
      if (
        !specialization ||
        !appointmentDuration ||
        parseInt(appointmentDuration) <= 0
      ) {
        setFormError(
          "Specialization and a positive appointment duration are required for doctors."
        );
        return;
      }
      registrationData.specialization = specialization;
      registrationData.appointmentDuration = parseInt(appointmentDuration);

      if (
        !weekdayStartTime ||
        !weekdayEndTime ||
        weekdayStartTime >= weekdayEndTime
      ) {
        setFormError(
          "Valid weekday start and end times are required (end time must be after start time)."
        );
        return;
      }
      registrationData.weekdayStartTime = weekdayStartTime;
      registrationData.weekdayEndTime = weekdayEndTime;
      registrationData.worksWeekends = worksWeekends;

      if (worksWeekends) {
        if (
          !weekendStartTime ||
          !weekendEndTime ||
          weekendStartTime >= weekendEndTime
        ) {
          setFormError(
            "Valid weekend start and end times are required when working weekends."
          );
          return;
        }
        registrationData.weekendStartTime = weekendStartTime;
        registrationData.weekendEndTime = weekendEndTime;
      }
    }

    await register(registrationData);
  };

  const displayError = formError || authError;

  return (
    <div className="min-h-[calc(100dvh-7rem)] flex items-center justify-center px-4 py-12 relative">
      {/* Ambient Refraction */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/[0.05] dark:bg-sky-500/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-lg doppelrand-shell animate-materialize">
        <div className="doppelrand-core p-7 sm:p-9">
          <div className="specular-hairline" />

          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 items-center justify-center text-white mb-3 shadow-sm shadow-sky-500/20">
              <svg
                width="22"
                height="22"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 6V26M6 16H26"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Create DeadLines Account
            </h2>
            <p className="font-body text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Join as a patient or configure your clinical practice
            </p>
          </div>

          {/* Error Notice */}
          {displayError && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium font-mono-code flex items-center gap-2">
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label
                htmlFor="role"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
              >
                Account Persona
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all cursor-pointer font-medium"
              >
                <option value="patient">Patient (Schedule & Manage Visits)</option>
                <option value="doctor">Doctor (Clinical Practice & Slot Engine)</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Dr. Sarah Connor or John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <EnvelopeSimple size={18} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* Passwords in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <LockKey size={18} />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <LockKey size={18} />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength="6"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Doctor-Specific Fields */}
            {formData.role === "doctor" && (
              <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.06] space-y-4 animate-materialize">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono-code">
                  <FirstAidKit size={16} />
                  <span>Physician Clinical Settings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="specialization"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                    >
                      Specialization
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Stethoscope size={18} />
                      </div>
                      <input
                        type="text"
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        required
                        placeholder="Cardiologist"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="appointmentDuration"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                    >
                      Slot Duration (mins)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Clock size={18} />
                      </div>
                      <input
                        type="number"
                        id="appointmentDuration"
                        name="appointmentDuration"
                        value={formData.appointmentDuration}
                        onChange={handleChange}
                        required
                        min="5"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all font-mono-code"
                      />
                    </div>
                  </div>
                </div>

                {/* Standard Hours Block */}
                <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] space-y-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono-code block">
                    Working Hours
                  </span>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Weekdays (Mon-Fri)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        name="weekdayStartTime"
                        value={formData.weekdayStartTime}
                        onChange={handleChange}
                        required
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1117] text-zinc-950 dark:text-white text-xs font-mono-code"
                      />
                      <span className="text-xs text-zinc-400 font-mono-code">to</span>
                      <input
                        type="time"
                        name="weekdayEndTime"
                        value={formData.weekdayEndTime}
                        onChange={handleChange}
                        required
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1117] text-zinc-950 dark:text-white text-xs font-mono-code"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="worksWeekends"
                      name="worksWeekends"
                      checked={formData.worksWeekends}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-zinc-300 dark:border-zinc-700"
                    />
                    <label
                      htmlFor="worksWeekends"
                      className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      Available for weekend consultations (Sat-Sun)?
                    </label>
                  </div>

                  {formData.worksWeekends && (
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.06]">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                        Weekends (Sat-Sun)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          name="weekendStartTime"
                          value={formData.weekendStartTime}
                          onChange={handleChange}
                          required
                          className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1117] text-zinc-950 dark:text-white text-xs font-mono-code"
                        />
                        <span className="text-xs text-zinc-400 font-mono-code">to</span>
                        <input
                          type="time"
                          name="weekendEndTime"
                          value={formData.weekendEndTime}
                          onChange={handleChange}
                          required
                          className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0E1117] text-zinc-950 dark:text-white text-xs font-mono-code"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative inline-flex items-center justify-center gap-3 py-2.5 px-5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              >
                {isLoading ? (
                  <>
                    <SpinnerGap size={18} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="w-7 h-7 rounded-full bg-white/15 dark:bg-zinc-950/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight size={14} weight="bold" />
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-7 pt-5 border-t border-zinc-100 dark:border-white/[0.06] text-center text-xs text-zinc-500 dark:text-zinc-400">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Sign in to your portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
