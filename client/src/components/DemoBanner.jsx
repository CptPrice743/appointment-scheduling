import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import {
  User,
  Stethoscope,
  ShieldCheck,
  ArrowCounterClockwise,
  Sparkle,
  CheckCircle,
  WarningCircle,
  SpinnerGap,
} from "@phosphor-icons/react";

const DEMO_ACCOUNTS = {
  patient: {
    email: "patient.john@example.com",
    password: "patientpassword123",
    label: "Patient (John Doe)",
    route: "/appointments",
  },
  doctor: {
    email: "doctor.sarah@example.com",
    password: "doctorpassword123",
    label: "Doctor (Dr. Sarah)",
    route: "/doctor/dashboard",
  },
  admin: {
    email: "admin@example.com",
    password: "adminpassword123",
    label: "Admin",
    route: "/admin/dashboard",
  },
};

const DemoBanner = () => {
  const { user, isAuthenticated, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState(null);

  if (!isAuthenticated || !user) return null;

  const currentEmail = user.email?.toLowerCase();
  const isDemoUser = Object.values(DEMO_ACCOUNTS).some(
    (acc) => acc.email.toLowerCase() === currentEmail
  );

  if (!isDemoUser) return null;

  const handleSwitch = async (roleKey) => {
    const target = DEMO_ACCOUNTS[roleKey];
    if (!target) return;
    try {
      await login(target.email, target.password);
      navigate(target.route);
      setNotification({ type: "success", text: `Switched session to ${target.label}` });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Failed to switch demo role:", err);
      setNotification({ type: "error", text: "Role switch failed" });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleResetData = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      const res = await axios.post("/api/demo/reset");
      if (res.data?.success) {
        setNotification({
          type: "success",
          text: "Demo database restored to default seed state!",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to reset demo database:", err);
      setNotification({
        type: "error",
        text: "Failed to reset demo data. Please try again.",
      });
      setIsResetting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <aside
      aria-label="Demo environment controls"
      className="sticky top-0 z-50 w-full bg-zinc-950 text-white border-b border-sky-500/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-mono shadow-md backdrop-blur-md bg-zinc-950/95"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Current Persona Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-medium">
            <Sparkle size={13} weight="fill" className="animate-pulse text-sky-400" />
            <span>Interactive Demo</span>
          </span>
          <span className="text-zinc-300 hidden md:inline">
            Active: <strong className="text-white font-semibold">{user.name}</strong> ({user.role})
          </span>
        </div>

        {/* Quick Switcher Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-zinc-400 text-[11px] hidden lg:inline mr-1">Switch Persona:</span>
          
          {user.role !== "patient" && (
            <button
              onClick={() => handleSwitch("patient")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10 transition-colors text-[11px] cursor-pointer"
              title="Switch to Patient Persona"
            >
              <User size={13} />
              <span>Patient</span>
            </button>
          )}

          {user.role !== "doctor" && (
            <button
              onClick={() => handleSwitch("doctor")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10 transition-colors text-[11px] cursor-pointer"
              title="Switch to Doctor Persona"
            >
              <Stethoscope size={13} />
              <span>Doctor</span>
            </button>
          )}

          {user.role !== "admin" && (
            <button
              onClick={() => handleSwitch("admin")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10 transition-colors text-[11px] cursor-pointer"
              title="Switch to Admin Persona"
            >
              <ShieldCheck size={13} />
              <span>Admin</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

          {/* Reset Demo Data Button */}
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-all text-[11px] cursor-pointer disabled:opacity-50"
            title="Wipe and restore clean initial demo records"
          >
            {isResetting ? (
              <SpinnerGap size={13} className="animate-spin text-rose-400" />
            ) : (
              <ArrowCounterClockwise size={13} />
            )}
            <span>{isResetting ? "Resetting..." : "Reset Demo Data"}</span>
          </button>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3.5 py-1.5 rounded-lg shadow-xl text-xs font-sans font-medium flex items-center gap-2 transition-all ${
            notification.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-rose-600 text-white shadow-rose-500/20"
          }`}
        >
          {notification.type === "success" ? <CheckCircle size={15} /> : <WarningCircle size={15} />}
          <span>{notification.text}</span>
        </div>
      )}
    </aside>
  );
};

export default DemoBanner;
