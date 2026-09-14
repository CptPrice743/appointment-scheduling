import React, {
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import SpecificAvailabilityCalendar from "../components/Availability/SpecificAvailabilityCalendar";
import {
  UserCircle,
  EnvelopeSimple,
  Clock,
  FloppyDisk,
  CheckCircle,
  WarningCircle,
  CalendarCheck,
  CalendarPlus,
  ShieldCheck,
  Key,
  IdentificationBadge,
  Sparkle,
  ArrowUpRight,
  Fingerprint,
} from "@phosphor-icons/react";

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
  const isAdmin = user?.role === "admin";
  const isPatient = user?.role === "patient";

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

  const profileMsgTimeoutRef = useRef(null);
  const availabilityMsgTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(profileMsgTimeoutRef.current);
      clearTimeout(availabilityMsgTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (profileMessage || profileError) {
      clearTimeout(profileMsgTimeoutRef.current);
      profileMsgTimeoutRef.current = setTimeout(() => {
        setProfileMessage("");
        setProfileError("");
      }, 3500);
    }
    return () => clearTimeout(profileMsgTimeoutRef.current);
  }, [profileMessage, profileError]);

  useEffect(() => {
    if (availabilityMessage || availabilityError) {
      clearTimeout(availabilityMsgTimeoutRef.current);
      availabilityMsgTimeoutRef.current = setTimeout(() => {
        setAvailabilityMessage("");
        setAvailabilityError("");
      }, 3500);
    }
    return () => clearTimeout(availabilityMsgTimeoutRef.current);
  }, [availabilityMessage, availabilityError]);

  useEffect(() => {
    if (user) {
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
    clearError();
  }, [user, isDoctor, clearError]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setProfileError("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileMessage("");
    setProfileError("");
    try {
      const res = await axiosInstance.put("/users/profile", profileData);
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setProfileMessage("Identity credentials synchronized successfully.");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to update profile credentials.";
      setProfileError(errorMsg);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAvailabilityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStdAvailabilityData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setAvailabilityError("");
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setAvailabilityLoading(true);
    setAvailabilityMessage("");
    setAvailabilityError("");

    const newStandardAvailability = [];
    WEEKDAYS.forEach((day) => {
      newStandardAvailability.push({
        dayOfWeek: day,
        startTime: stdAvailabilityData.weekdayStartTime,
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
      setAvailabilityMessage("Standard recurring practice hours confirmed.");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to save practice availability.";
      setAvailabilityError(errorMsg);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25";
      case "doctor":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25";
      case "patient":
      default:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-sm text-zinc-400">
        <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        <span className="font-mono-code text-xs uppercase tracking-wider">
          Decrypting identity record...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1650px] mx-auto py-8 sm:py-10 px-4 sm:px-8 lg:px-12 space-y-8 animate-materialize">
      
      {/* Top Identity Telemetry Banner (Doppelrand Shell) */}
      <div className="doppelrand-shell">
        <div className="doppelrand-core p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="specular-hairline" />

          <div className="flex items-center gap-5">
            {/* Large User Avatar */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 flex items-center justify-center font-display font-bold text-2xl sm:text-3xl shadow-sm">
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D1117]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-zinc-950 dark:text-white tracking-tight">
                  {profileData.name || "Authenticated User"}
                </h1>
                <span
                  className={`font-mono-code text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border select-none ${getRoleBadgeStyle(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code text-zinc-500 dark:text-zinc-400 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <EnvelopeSimple size={14} className="text-sky-500" />
                  {profileData.email}
                </span>
                <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                <span className="flex items-center gap-1.5">
                  <Fingerprint size={14} className="text-emerald-500" />
                  Account ID: {user._id?.slice(-8) || "AUTHENTICATED"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <div className="h-10 px-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] font-mono-code text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>TLS 1.3 End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Symmetrical Dual-Column Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* Column 1: Personal Identity & Contact (Consistent for all roles) */}
        <div className="doppelrand-shell h-full">
          <div className="doppelrand-core p-6 sm:p-8 h-full flex flex-col justify-between space-y-6">
            <div className="specular-hairline" />

            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserCircle size={22} className="text-sky-600 dark:text-sky-400" />
                  <div>
                    <h2 className="font-display font-bold text-base text-zinc-950 dark:text-white tracking-tight">
                      Personal Identity & Credentials
                    </h2>
                    <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Maintain your primary account identity and communication contact.
                    </p>
                  </div>
                </div>
                <span className="font-mono-code text-[10px] uppercase tracking-wider text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04]">
                  Primary
                </span>
              </div>

              {/* Status Notifications */}
              {profileMessage && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-materialize">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>{profileMessage}</span>
                </div>
              )}
              {profileError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 animate-materialize">
                  <WarningCircle size={16} className="shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      required
                      placeholder="e.g. Jane Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-body focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none t-focus-ring"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-xs font-mono-code focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 focus:outline-none t-focus-ring"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loadingProfile}
                    className="h-10 w-full px-5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs tracking-tight hover:opacity-90 inline-flex items-center justify-center gap-2 btn-press cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <FloppyDisk size={16} />
                    <span>{loadingProfile ? "Synchronizing..." : "Update Identity Record"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Micro Telemetry Footnote */}
            <div className="pt-4 border-t border-zinc-200/60 dark:border-white/[0.05] flex items-center justify-between text-[11px] font-mono-code text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>End-to-End Signed</span>
              </span>
              <span className="text-zinc-400">Node ID: {user._id?.slice(-6) || "ONLINE"}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Role-Specific Operational Chassis (Matched in visual weight & structure) */}
        <div className="doppelrand-shell h-full">
          {isDoctor ? (
            /* Doctor Standard Recurring Availability Form */
            <div className="doppelrand-core p-6 sm:p-8 h-full flex flex-col justify-between space-y-6">
              <div className="specular-hairline" />

              <div className="space-y-6">
                <div className="pb-4 border-b border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock size={22} className="text-sky-600 dark:text-sky-400" />
                    <div>
                      <h2 className="font-display font-bold text-base text-zinc-950 dark:text-white tracking-tight">
                        Standard Weekly Practice Hours
                      </h2>
                      <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Define recurring weekly availability for auto-generated patient slots.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-code text-[10px] uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
                    Recurring
                  </span>
                </div>

                {/* Availability Messages */}
                {availabilityMessage && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-materialize">
                    <CheckCircle size={16} className="shrink-0" />
                    <span>{availabilityMessage}</span>
                  </div>
                )}
                {availabilityError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 animate-materialize">
                    <WarningCircle size={16} className="shrink-0" />
                    <span>{availabilityError}</span>
                  </div>
                )}

                {availabilityLoading ? (
                  <div className="text-xs font-mono-code text-zinc-400 py-6 text-center">
                    Retrieving schedule configuration...
                  </div>
                ) : (
                  <fieldset className="space-y-4">
                    {/* Weekday Hours */}
                    <div className="p-4 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.07]">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-2">
                        Weekday Hours (Monday to Friday)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          name="weekdayStartTime"
                          value={stdAvailabilityData.weekdayStartTime}
                          onChange={handleAvailabilityChange}
                          required
                          className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#131720] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none t-focus-ring"
                        />
                        <span className="text-xs font-mono-code text-zinc-400 font-semibold">TO</span>
                        <input
                          type="time"
                          name="weekdayEndTime"
                          value={stdAvailabilityData.weekdayEndTime}
                          onChange={handleAvailabilityChange}
                          required
                          className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#131720] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none t-focus-ring"
                        />
                      </div>
                    </div>

                    {/* Weekend Toggle */}
                    <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.07] bg-zinc-50/70 dark:bg-white/[0.02] cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-white/[0.04] transition-colors">
                      <input
                        type="checkbox"
                        id="worksWeekends"
                        name="worksWeekends"
                        checked={stdAvailabilityData.worksWeekends}
                        onChange={handleAvailabilityChange}
                        className="w-4 h-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 select-none">
                        Accept consultations on Weekends (Saturday & Sunday)?
                      </span>
                    </label>

                    {/* Weekend Hours conditional */}
                    {stdAvailabilityData.worksWeekends && (
                      <div className="p-4 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.07] animate-materialize">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-2">
                          Weekend Operating Window
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="time"
                            name="weekendStartTime"
                            value={stdAvailabilityData.weekendStartTime}
                            onChange={handleAvailabilityChange}
                            required={stdAvailabilityData.worksWeekends}
                            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#131720] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none t-focus-ring"
                          />
                          <span className="text-xs font-mono-code text-zinc-400 font-semibold">TO</span>
                          <input
                            type="time"
                            name="weekendEndTime"
                            value={stdAvailabilityData.weekendEndTime}
                            onChange={handleAvailabilityChange}
                            required={stdAvailabilityData.worksWeekends}
                            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#131720] text-zinc-950 dark:text-white font-mono-code text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none t-focus-ring"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={handleSaveAvailability}
                        disabled={availabilityLoading}
                        className="h-10 w-full px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs tracking-tight inline-flex items-center justify-center gap-2 btn-press cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <FloppyDisk size={16} />
                        <span>
                          {availabilityLoading ? "Saving..." : "Commit Practice Hours"}
                        </span>
                      </button>
                    </div>
                  </fieldset>
                )}
              </div>

              {/* Status Footnote */}
              <div className="pt-4 border-t border-zinc-200/60 dark:border-white/[0.05] flex items-center justify-between text-[11px] font-mono-code text-zinc-500 dark:text-zinc-400">
                <span>Standard Slot Duration</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  {user.doctorProfile?.appointmentDuration || "30"} Minutes
                </span>
              </div>
            </div>
          ) : isPatient ? (
            /* Patient Portal & Quick Operations Card */
            <div className="doppelrand-core p-6 sm:p-8 h-full flex flex-col justify-between space-y-6">
              <div className="specular-hairline" />

              <div className="space-y-6">
                <div className="pb-4 border-b border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CalendarCheck size={22} className="text-emerald-500" />
                    <div>
                      <h2 className="font-display font-bold text-base text-zinc-950 dark:text-white tracking-tight">
                        Patient Health Portal & Access
                      </h2>
                      <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Manage your consultations, diagnostic remarks, and physician bookings.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-code text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    Patient Hub
                  </span>
                </div>

                {/* Harmonized Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/appointments"
                    className="p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] transition-all group active:scale-[0.98] flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                        <CalendarCheck size={20} />
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                          Consultation Ledger
                        </h3>
                        <ArrowUpRight size={15} className="text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Audit past visits, physician diagnostic remarks, and upcoming slots.
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/add"
                    className="p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] transition-all group active:scale-[0.98] flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                        <CalendarPlus size={20} />
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                          Book Consultation
                        </h3>
                        <ArrowUpRight size={15} className="text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Select specialized medical physicians, available dates, and symptoms.
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Security & Access Scope Information */}
                <div className="space-y-2.5 font-body text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.05]">
                    <span className="font-medium">Access Tier</span>
                    <span className="font-mono-code font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      PATIENT
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.05]">
                    <span className="font-medium">Session Status</span>
                    <span className="inline-flex items-center gap-1.5 font-mono-code text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      AUTHENTICATED
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Protection Footnote */}
              <div className="pt-4 border-t border-zinc-200/60 dark:border-white/[0.05] flex items-center gap-2.5 text-[11px] font-body text-zinc-500 dark:text-zinc-400">
                <Sparkle size={15} className="text-sky-500 shrink-0" />
                <span>Consultation records are encrypted in compliance with medical data privacy standards.</span>
              </div>
            </div>
          ) : (
            /* Admin Governance Card */
            <div className="doppelrand-core p-6 sm:p-8 h-full flex flex-col justify-between space-y-6">
              <div className="specular-hairline" />

              <div className="space-y-6">
                <div className="pb-4 border-b border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={22} className="text-rose-500" />
                    <div>
                      <h2 className="font-display font-bold text-base text-zinc-950 dark:text-white tracking-tight">
                        Platform Administration & Control
                      </h2>
                      <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        System-wide governance, practitioner management, and oversight auditing.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-code text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                    Root Privileges
                  </span>
                </div>

                {/* Admin Quick Navigation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    to="/admin/users"
                    className="p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                        User Directory
                      </div>
                      <ArrowUpRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <div className="text-[11px] text-zinc-500">Privilege & Role Control</div>
                  </Link>

                  <Link
                    to="/admin/doctors"
                    className="p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                        Physician Matrix
                      </div>
                      <ArrowUpRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <div className="text-[11px] text-zinc-500">Specialties & Capacity</div>
                  </Link>

                  <Link
                    to="/admin/appointments"
                    className="p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                        Oversight Ledger
                      </div>
                      <ArrowUpRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <div className="text-[11px] text-zinc-500">Global System Audit</div>
                  </Link>
                </div>

                {/* Security Scope */}
                <div className="space-y-2.5 font-body text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.05]">
                    <span className="font-medium">Governance Level</span>
                    <span className="font-mono-code font-bold uppercase text-rose-600 dark:text-rose-400">
                      ADMINISTRATOR (FULL ACCESS)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.05]">
                    <span className="font-medium">Session Status</span>
                    <span className="inline-flex items-center gap-1.5 font-mono-code text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE PRIVILEGED SESSION
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Footnote */}
              <div className="pt-4 border-t border-zinc-200/60 dark:border-white/[0.05] flex items-center justify-between text-[11px] font-mono-code text-zinc-500 dark:text-zinc-400">
                <span>Database Node: MongoDB 7.0 (Local Cluster)</span>
                <span className="text-emerald-500 font-semibold">SYNCHRONIZED</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* For Doctor Only: Full-Width Dedicated Studio Card for Date Overrides & Calendar */}
      {isDoctor && (
        <div className="w-full space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200/80 dark:border-white/[0.08]">
            <div>
              <h2 className="font-display font-bold text-xl text-zinc-950 dark:text-white tracking-tight">
                Calendar Exception Engine & Date Overrides
              </h2>
              <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure bespoke operating windows, mark clinical leaves, or customize slot capacity for specific calendar dates.
              </p>
            </div>
            <span className="font-mono-code text-[11px] font-semibold px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 w-fit">
              Real-Time Slot Engine
            </span>
          </div>

          <SpecificAvailabilityCalendar
            key={JSON.stringify(user?.doctorProfile?.standardAvailability)}
          />
        </div>
      )}
    </div>
  );
};

export default UserProfileEdit;
