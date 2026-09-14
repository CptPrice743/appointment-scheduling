import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import {
  CalendarCheck,
  ShieldCheck,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Stethoscope,
  UsersThree,
  Sparkle,
  Pulse,
  LockSimple,
  Fingerprint,
  ArrowCounterClockwise,
  Lightning,
  Check,
  WarningCircle,
  Cpu,
  User,
  Star,
  Play,
  Pause,
  Broadcast,
} from "@phosphor-icons/react";

const CLINIC_DOCTORS = [
  {
    id: "sarah",
    name: "Dr. Sarah Connor",
    spec: "Cardiology",
    suite: "Suite 101 · Cardio Lab",
    status: "Consultation in Progress",
    rating: "4.98",
    reviews: 142,
    capacity: 80,
    duration: "30m",
    initials: "SC",
    badge: "Lead Cardiologist",
    slots: ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"],
    symptoms: "Chest tightness, arrhythmia, hypertension review",
  },
  {
    id: "house",
    name: "Dr. Gregory House",
    spec: "Diagnostic Medicine",
    suite: "Suite 102 · Pathology Lab",
    status: "Differential Diagnostic Audit",
    rating: "4.92",
    reviews: 119,
    capacity: 90,
    duration: "45m",
    initials: "GH",
    badge: "Dept. Chair",
    slots: ["11:00 AM", "01:15 PM", "02:45 PM", "04:00 PM"],
    symptoms: "Unexplained systemic fatigue, autoimmune differential",
  },
  {
    id: "cuddy",
    name: "Dr. Lisa Cuddy",
    spec: "Endocrinology",
    suite: "Suite 103 · Endocrine Center",
    status: "Accepting Walk-ins & Bookings",
    rating: "4.99",
    reviews: 168,
    capacity: 65,
    duration: "30m",
    initials: "LC",
    badge: "Dean of Medicine",
    slots: ["08:30 AM", "10:30 AM", "01:00 PM", "03:00 PM"],
    symptoms: "Thyroid hormone calibration, metabolic disorder",
  },
  {
    id: "wilson",
    name: "Dr. James Wilson",
    spec: "Oncology",
    suite: "Suite 104 · Oncology Clinic",
    status: "Histology Consultation",
    rating: "4.97",
    reviews: 134,
    capacity: 75,
    duration: "45m",
    initials: "JW",
    badge: "Head of Oncology",
    slots: ["09:30 AM", "11:00 AM", "02:30 PM", "04:15 PM"],
    symptoms: "Genetic marker evaluation, clinical histology audit",
  },
];

const DATES = [
  { day: "Mon", date: "14", full: "Sep 14, 2026" },
  { day: "Tue", date: "15", full: "Sep 15, 2026" },
  { day: "Wed", date: "16", full: "Sep 16, 2026" },
  { day: "Thu", date: "17", full: "Sep 17, 2026" },
  { day: "Fri", date: "18", full: "Sep 18, 2026" },
  { day: "Sat", date: "19", full: "Sep 19, 2026" },
];

const TELEMETRY_FEED = [
  { id: 1, text: "Dr. Sarah Connor · Mutex locked · Slot 10:00 AM secured", time: "10:44:02", tag: "LOCK_ACQUIRED" },
  { id: 2, text: "Atomic Mutex Engine · Zero-collision isolation verified on Mongo Cluster", time: "10:43:49", tag: "CLUSTER_OK" },
  { id: 3, text: "Dr. Gregory House opened 3 slots for Diagnostic differential", time: "10:43:21", tag: "SCHEDULE_SYNC" },
  { id: 4, text: "Concurrent request clash resolved in 11ms · Patient redirected seamlessly", time: "10:42:58", tag: "RACE_RESOLVED" },
  { id: 5, text: "TLS 1.3 cryptographic handshake established · 256-bit GCM", time: "10:42:30", tag: "TLS_SECURE" },
];

const SPECIALTIES = ["All", "Cardiology", "Diagnostic Medicine", "Endocrinology", "Oncology"];

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const heroSimulatorRef = useRef(null);

  // Specialist & Slot Selection States
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleQuickDemo = async (email, password, route) => {
    try {
      await login(email, password);
      navigate(route);
    } catch (err) {
      console.error("Demo login failed:", err);
    }
  };

  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedDoctorId, setSelectedDoctorId] = useState("sarah");
  const [selectedDateObj, setSelectedDateObj] = useState(DATES[0]);
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM");
  const [isSlotLocked, setIsSlotLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(300);
  const [isTestConfirmed, setIsTestConfirmed] = useState(false);

  // Live Telemetry Feed States
  const [feedIndex, setFeedIndex] = useState(0);
  const [isFeedPaused, setIsFeedPaused] = useState(false);

  // Interactive Concurrency Simulator States
  const [simState, setSimState] = useState("idle"); // idle | running | resolved
  const [simConflictSlot, setSimConflictSlot] = useState("10:00 AM");
  const [simOffsetMs, setSimOffsetMs] = useState(2);
  const [simStats, setSimStats] = useState({ count: 1428, lastLatency: 12 });

  const currentDoctor = CLINIC_DOCTORS.find((d) => d.id === selectedDoctorId) || CLINIC_DOCTORS[0];

  const filteredDoctors = selectedSpecialty === "All"
    ? CLINIC_DOCTORS
    : CLINIC_DOCTORS.filter((doc) => doc.spec.toLowerCase().includes(selectedSpecialty.toLowerCase()));

  // Telemetry cycling timer
  useEffect(() => {
    if (isFeedPaused) return;
    const interval = setInterval(() => {
      setFeedIndex((prev) => (prev + 1) % TELEMETRY_FEED.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isFeedPaused]);

  // Countdown timer for locked slot
  useEffect(() => {
    let timer;
    if (isSlotLocked && lockCountdown > 0) {
      timer = setInterval(() => setLockCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isSlotLocked, lockCountdown]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setIsSlotLocked(true);
    setLockCountdown(300);
    setIsTestConfirmed(false);
  };

  const handleConfirmSimulation = () => {
    setIsTestConfirmed(true);
  };

  const handleRunConcurrencySim = () => {
    setSimState("running");
    setTimeout(() => {
      setSimState("resolved");
      setSimStats((prev) => ({
        count: prev.count + 1,
        lastLatency: 10 + Math.floor(Math.random() * 4),
      }));
    }, 1100);
  };

  const handleSelectFromRadar = (docId) => {
    setSelectedDoctorId(docId);
    const doc = CLINIC_DOCTORS.find((d) => d.id === docId);
    if (doc && doc.slots.length > 0) {
      setSelectedSlot(doc.slots[0]);
      setIsSlotLocked(true);
      setLockCountdown(300);
      setIsTestConfirmed(false);
    }
    if (heroSimulatorRef.current) {
      heroSimulatorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `0${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full overflow-x-hidden transition-colors duration-300 clinical-grid-texture">
      
      {/* 1. Asymmetric Split Hero & Clinical Command Deck */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Subtle Ambient Refraction Orbs */}
        <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-sky-500/[0.08] dark:bg-sky-500/[0.05] rounded-full blur-3xl pointer-events-none -z-10 animate-float-orb" />
        <div className="absolute top-1/3 -right-20 w-[520px] h-[520px] bg-emerald-500/[0.07] dark:bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none -z-10 animate-float-orb" style={{ animationDelay: "-6s" }} />

        <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Focused Value Proposition, Live Feed & Telemetry */}
            <div className="lg:col-span-5 flex flex-col items-start text-left space-y-6">
              
              {/* Eyebrow Badge with Live Telemetry */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-semibold uppercase tracking-[0.2em] font-mono-code shadow-xs">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span>Real-Time Dispatch · Latency &lt;14ms</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-zinc-950 dark:text-white leading-[1.06]">
                Surgical precision. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 dark:from-sky-400 dark:via-sky-300 dark:to-teal-300">
                  Zero scheduling drag.
                </span>
              </h1>

              {/* Subtext */}
              <p className="font-body text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[48ch]">
                Atomic calendar orchestration, conflict-free concurrency locks, and instant multi-specialty physician matching. Built for modern high-throughput clinical practice.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto pt-1">
                <Link
                  to="/register"
                  className="h-11 pl-5 pr-2 inline-flex items-center justify-center gap-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs sm:text-sm tracking-tight transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-sm"
                >
                  <span>Schedule Consultation</span>
                  <span className="w-7 h-7 rounded-lg bg-white/15 dark:bg-zinc-950/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight size={14} weight="bold" />
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="h-11 px-5 inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                >
                  Provider Sign In
                </Link>
              </div>

              {/* 1-Click Quick Demo Evaluation Strip */}
              <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-sky-500/[0.05] dark:bg-sky-500/[0.04] border border-sky-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono-code flex items-center gap-1.5">
                    <Sparkle size={13} weight="fill" />
                    Instant Recruiter & Reviewer Demo
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono-code">1-Click Auto Login</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("patient.john@example.com", "patientpassword123", "/appointments")}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 text-xs font-semibold transition-all shadow-xs hover:border-sky-500/40 cursor-pointer"
                  >
                    <User size={13} className="text-sky-500" />
                    <span>Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("doctor.sarah@example.com", "doctorpassword123", "/doctor/dashboard")}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 text-xs font-semibold transition-all shadow-xs hover:border-sky-500/40 cursor-pointer"
                  >
                    <Stethoscope size={13} className="text-emerald-500" />
                    <span>Doctor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("admin@example.com", "adminpassword123", "/admin/dashboard")}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 text-xs font-semibold transition-all shadow-xs hover:border-sky-500/40 cursor-pointer"
                  >
                    <ShieldCheck size={13} className="text-amber-500" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Micro Metrics Triple-Strip */}
              <div className="grid grid-cols-3 gap-3 w-full pt-2">
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.02]">
                  <span className="font-mono-code text-[10px] text-zinc-400 uppercase tracking-wider block">Lock Speed</span>
                  <span className="font-display font-bold text-base text-zinc-900 dark:text-white">&lt; 12ms</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.02]">
                  <span className="font-mono-code text-[10px] text-zinc-400 uppercase tracking-wider block">Collision Rate</span>
                  <span className="font-display font-bold text-base text-emerald-600 dark:text-emerald-400">0.00%</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.02]">
                  <span className="font-mono-code text-[10px] text-zinc-400 uppercase tracking-wider block">Active Nodes</span>
                  <span className="font-display font-bold text-base text-sky-600 dark:text-sky-400">4 Suites</span>
                </div>
              </div>

              {/* Live Real-Time Telemetry Stream Box */}
              <div className="w-full pt-4 border-t border-zinc-200/80 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono-code text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Pulse size={14} className="animate-pulse" />
                    <span>REAL-TIME TRANSACTION STREAM</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFeedPaused(!isFeedPaused)}
                    className="flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer text-[10px]"
                    title={isFeedPaused ? "Resume Live Feed" : "Pause Live Feed"}
                  >
                    {isFeedPaused ? <Play size={11} weight="fill" /> : <Pause size={11} weight="fill" />}
                    <span>{isFeedPaused ? "PAUSED" : "STREAMING"}</span>
                  </button>
                </div>

                {/* Rotating Event Pill with smooth transition */}
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.07] bg-white dark:bg-[#11151F] shadow-xs flex items-center justify-between gap-3 min-h-[50px] transition-all">
                  <div key={`feed-${feedIndex}`} className="flex items-center gap-2.5 overflow-hidden animate-text-swap">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono-code text-xs text-zinc-800 dark:text-zinc-200 truncate">
                      {TELEMETRY_FEED[feedIndex].text}
                    </span>
                  </div>
                  <div key={`time-${feedIndex}`} className="flex items-center gap-2 shrink-0 animate-text-swap">
                    <span className="font-mono-code text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.05] text-zinc-500 dark:text-zinc-400">
                      {TELEMETRY_FEED[feedIndex].time}
                    </span>
                  </div>
                </div>

                {/* SVG ECG scanline */}
                <div className="w-full h-6 overflow-hidden relative flex items-center opacity-70">
                  <svg className="w-full h-6" viewBox="0 0 400 24" fill="none" preserveAspectRatio="none">
                    <path
                      d="M0 12 H80 L90 4 L100 20 L110 6 L120 14 L130 12 H220 L230 3 L240 21 L250 8 L260 14 L270 12 H400"
                      stroke="url(#ecgGradient)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      className="animate-ecg-scan"
                    />
                    <defs>
                      <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Column: The Interactive Clinical Command Deck Simulator */}
            <div className="lg:col-span-7 relative" ref={heroSimulatorRef}>
              <div className="doppelrand-shell shadow-2xl">
                <div className="doppelrand-core p-6 sm:p-8 space-y-5">
                  <div className="specular-hairline" />

                  {/* Top Bar: Live Dispatcher Engine Header */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <Broadcast size={16} className="text-sky-500 animate-pulse" />
                        <span className="font-mono-code text-[11px] font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                          Clinical Dispatch Studio
                        </span>
                      </div>
                      <span className="font-mono-code text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        LIVE RESERVATION ENGINE
                      </span>
                    </div>

                    {/* Specialty Category Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {SPECIALTIES.map((spec) => {
                        const isSelected = selectedSpecialty === spec;
                        return (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => {
                              setSelectedSpecialty(spec);
                              if (spec !== "All") {
                                const match = CLINIC_DOCTORS.find((d) => d.spec.toLowerCase().includes(spec.toLowerCase()));
                                if (match) {
                                  setSelectedDoctorId(match.id);
                                  setSelectedSlot(match.slots[0]);
                                  setIsSlotLocked(false);
                                  setIsTestConfirmed(false);
                                }
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code font-semibold btn-press cursor-pointer ${
                              isSelected
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                                : "bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/[0.08]"
                            }`}
                          >
                            {spec}
                          </button>
                        );
                      })}
                    </div>

                    {/* Specialist Pill Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {filteredDoctors.map((doc) => {
                        const isSelected = selectedDoctorId === doc.id;
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              setSelectedDoctorId(doc.id);
                              setSelectedSlot(doc.slots[0]);
                              setIsSlotLocked(false);
                              setIsTestConfirmed(false);
                            }}
                            className={`p-2.5 rounded-xl border text-left btn-press cursor-pointer ${
                              isSelected
                                ? "bg-sky-500/10 dark:bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400 shadow-xs"
                                : "bg-zinc-50/70 dark:bg-white/[0.02] border-zinc-200/80 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-sky-500/15 font-mono-code font-bold text-[10px] flex items-center justify-center text-sky-600 dark:text-sky-400">
                                {doc.initials}
                              </span>
                              <span className="font-display font-semibold text-xs text-zinc-900 dark:text-white truncate">
                                {doc.name.replace(/^Dr\.\s*/i, "")}
                              </span>
                            </div>
                            <div className="font-mono-code text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                              {doc.spec}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Doctor Telemetry & Capacity Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                          {currentDoctor.initials}
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#131720]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                              {currentDoctor.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono-code text-[10px] font-semibold border border-sky-500/20">
                              {currentDoctor.badge}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 font-body text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span>{currentDoctor.spec}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-500 font-mono-code text-[11px]">
                              <Star size={12} weight="fill" />
                              <strong>{currentDoctor.rating}</strong> ({currentDoctor.reviews})
                            </span>
                            <span>•</span>
                            <span className="font-mono-code text-[11px] text-zinc-400">{currentDoctor.duration} / visit</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono-code text-xs">
                        <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#131720] border border-zinc-200/80 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300">
                          <span className="text-emerald-500 font-bold">{currentDoctor.slots.length}</span> Slots Open Today
                        </div>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.04]">
                      <div className="flex items-center justify-between text-[10px] font-mono-code text-zinc-500 dark:text-zinc-400 mb-1.5">
                        <span>Daily Booking Capacity</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentDoctor.capacity}% Allocated</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${currentDoctor.capacity}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interactive Date & Slot Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                    {/* Left: Date Selector */}
                    <div className="sm:col-span-5 space-y-2">
                      <span className="font-mono-code text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">
                        Calendar Window
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {DATES.map((item) => {
                          const isPicked = selectedDateObj.date === item.date;
                          return (
                            <button
                              key={item.date}
                              type="button"
                              onClick={() => {
                                setSelectedDateObj(item);
                                setIsSlotLocked(false);
                                setIsTestConfirmed(false);
                              }}
                              className={`p-2 rounded-xl border text-center btn-press cursor-pointer ${
                                isPicked
                                  ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-xs font-bold"
                                  : "border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-[#131720] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/10"
                              }`}
                            >
                              <div className="text-[9px] uppercase font-mono-code text-zinc-400">{item.day}</div>
                              <div className="text-xs font-bold font-mono-code mt-0.5">{item.date}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Available Slot Matrix */}
                    <div className="sm:col-span-7 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono-code text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">
                          Instant Slot Lock
                        </span>
                        <span className="text-[10px] font-mono-code text-sky-500">
                          Click any slot to reserve
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {currentDoctor.slots.map((slot) => {
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => handleSlotClick(slot)}
                              className={`py-2 px-3 rounded-xl border font-mono-code text-xs font-semibold flex items-center justify-between btn-press cursor-pointer ${
                                isSelected
                                  ? "border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400 shadow-xs ring-1 ring-sky-500/30"
                                  : "border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-[#131720] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/10"
                              }`}
                            >
                              <span>{slot}</span>
                              {isSelected ? (
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                              ) : (
                                <span className="text-[10px] text-zinc-400 font-normal">Open</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Simulated Locked Pass Bar */}
                  {isSlotLocked ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-materialize">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Check size={18} weight="bold" />
                        </div>
                        <div>
                          <div className="font-display font-bold text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                            <span>Slot Reserved: {selectedDateObj.full} at {selectedSlot}</span>
                            {isTestConfirmed && (
                              <span className="px-2 py-0.2 rounded-md bg-emerald-600 text-white text-[9px] uppercase font-mono-code font-bold">
                                Confirmed
                              </span>
                            )}
                          </div>
                          <div className="font-mono-code text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                            {currentDoctor.name} ({currentDoctor.spec}) · Mutex hold expires in: <strong className="font-bold">{formatSeconds(lockCountdown)}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isTestConfirmed ? (
                          <button
                            type="button"
                            onClick={handleConfirmSimulation}
                            className="h-8.5 px-3.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-[#131720] text-emerald-600 dark:text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 active:scale-[0.97] transition-all cursor-pointer"
                          >
                            <span>Lock Test Pass</span>
                          </button>
                        ) : null}

                        <Link
                          to="/register"
                          className="h-8.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.97]"
                        >
                          <span>Confirm Booking</span>
                          <ArrowUpRight size={13} weight="bold" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04] text-xs font-mono-code text-zinc-400 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <LockSimple size={14} className="text-sky-500" />
                        Atomic Mutex Lock active for multi-user safety
                      </span>
                      <span className="hidden sm:inline text-zinc-500">Zero double-bookings</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Physician Suite Status Radar */}
      <section className="py-12 border-y border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-[#0A0D14]/50">
        <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono-code text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Live Clinic Floor Telemetry
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-1">
                Active Physician Suites & Next Available Windows
              </h2>
            </div>
            <span className="font-mono-code text-xs text-zinc-400">
              Click any suite to dispatch in simulator
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CLINIC_DOCTORS.map((doc) => {
              const isSelected = selectedDoctorId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectFromRadar(doc.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group active:scale-[0.98] ${
                    isSelected
                      ? "border-sky-500 bg-white dark:bg-[#121622] shadow-md ring-1 ring-sky-500/30"
                      : "border-zinc-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0E121B] hover:border-sky-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono-code text-[10px] uppercase font-bold text-zinc-400">
                      {doc.suite}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono-code font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ACTIVE
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-zinc-950 dark:text-white group-hover:text-sky-500 transition-colors">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-body mb-3">
                    {doc.spec}
                  </p>

                  <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-between text-xs font-mono-code">
                    <span className="text-zinc-400 text-[11px]">Next: {doc.slots[0]}</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Select Suite
                      <ArrowUpRight size={12} weight="bold" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Interactive Concurrency Engine Simulator ("Race Condition Resolver") */}
      <section className="py-20 border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-[#090C12]/80 backdrop-blur-xl">
        <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.2em] font-mono-code">
                <Lightning size={13} weight="bold" />
                <span>Zero-Conflict Guarantee</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                How DeadLines Solves the Double-Booking Dilemma
              </h2>
              <p className="font-body text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When two patients hit "Confirm" at the exact same millisecond, legacy systems crash or double-book. DeadLines executes an atomic isolation lock to grant the slot to Client A in 12ms while instantaneously directing Client B to the next available window.
              </p>

              {/* Millisecond Delay Selector */}
              <div className="pt-1 space-y-1.5">
                <span className="font-mono-code text-[11px] text-zinc-400 uppercase tracking-wider block">
                  Simulated Time Delta:
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 5].map((ms) => (
                    <button
                      key={ms}
                      type="button"
                      onClick={() => setSimOffsetMs(ms)}
                      className={`h-7 px-3 rounded-lg text-xs font-mono-code transition-all cursor-pointer ${
                        simOffsetMs === ms
                          ? "bg-sky-600 text-white font-bold"
                          : "bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                      }`}
                    >
                      +{ms}ms Delta
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunConcurrencySim}
                  disabled={simState === "running"}
                  className="h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs inline-flex items-center gap-2.5 transition-all active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <ArrowCounterClockwise size={15} className={simState === "running" ? "animate-spin" : ""} />
                  <span>{simState === "running" ? "Resolving Mutex Race..." : "Simulate 1ms Concurrency Conflict"}</span>
                </button>
              </div>
            </div>

            {/* Interactive Concurrency Visualizer */}
            <div className="lg:col-span-7">
              <div className="doppelrand-shell">
                <div className="doppelrand-core p-6 space-y-5">
                  <div className="specular-hairline" />

                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/[0.06] text-xs font-mono-code">
                    <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Contested Slot Target:</span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Sep 14 · {simConflictSlot}</span>
                  </div>

                  {/* Real-time Mutex Pulse Transit Bar */}
                  <div className="py-1 px-1 flex items-center justify-between text-[10px] font-mono-code text-zinc-400">
                    <div className="flex items-center gap-1 text-sky-500 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                      <span>Request A (0.012s)</span>
                    </div>
                    <div className="relative flex-1 mx-3 h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                      {simState === "running" && (
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-purple-500 rounded-full animate-pulse"
                          style={{ width: "100%", animationDuration: "0.8s" }}
                        />
                      )}
                      {simState === "resolved" && (
                        <div className="h-full w-full bg-emerald-500 transition-all duration-300" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-purple-500 font-semibold">
                      <span>Request B (+{simOffsetMs}ms)</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Client A */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                      simState === "resolved"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 shadow-xs"
                        : "border-zinc-200/80 dark:border-white/[0.07] bg-zinc-50/70 dark:bg-white/[0.02]"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 flex items-center justify-center font-bold text-[10px]">A</span>
                          <span className="font-display font-semibold text-xs">Patient John D.</span>
                        </div>
                        <span className="font-mono-code text-[10px] text-zinc-400">T: 10:00:00.012</span>
                      </div>
                      <div className="font-mono-code text-[11px] mt-2">
                        {simState === "running" && <span className="text-sky-500 animate-pulse">Acquiring Mutex Lock...</span>}
                        {simState === "resolved" && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-text-swap">
                            <Check size={14} weight="bold" />
                            CONFIRMED ({simStats.lastLatency}ms Lock Acquired)
                          </span>
                        )}
                        {simState === "idle" && <span className="text-zinc-400">Ready to simulate</span>}
                      </div>
                    </div>

                    {/* Client B */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                      simState === "resolved"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-xs"
                        : "border-zinc-200/80 dark:border-white/[0.07] bg-zinc-50/70 dark:bg-white/[0.02]"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold text-[10px]">B</span>
                          <span className="font-display font-semibold text-xs">Patient Emily D.</span>
                        </div>
                        <span className="font-mono-code text-[10px] text-zinc-400">T: 10:00:00.0{12 + simOffsetMs} (+{simOffsetMs}ms)</span>
                      </div>
                      <div className="font-mono-code text-[11px] mt-2">
                        {simState === "running" && <span className="text-amber-500 animate-pulse">Evaluating Concurrency...</span>}
                        {simState === "resolved" && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 animate-text-swap">
                            <ArrowCounterClockwise size={14} />
                            Slot Claimed · Redirected to 10:30 AM
                          </span>
                        )}
                        {simState === "idle" && <span className="text-zinc-400">Ready to simulate</span>}
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Counter Strip */}
                  <div className="p-3.5 rounded-xl bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono-code text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-2">
                      <Cpu size={15} className="text-sky-500" />
                      <span>Atomic Mongo Mutex Isolation Guarantee</span>
                    </span>
                    <div className="flex items-center gap-4">
                      <span>Simulations Run: <strong className="text-zinc-900 dark:text-white">{simStats.count}</strong></span>
                      <span className="text-emerald-500 font-semibold">0 Collisions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 4-Pillar Clinical Architecture Bento */}
      <section className="py-20">
        <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-12">
            <span className="font-mono-code text-[10px] uppercase tracking-wider text-sky-600 dark:text-sky-400 font-semibold block mb-1.5">
              SYSTEM FOUNDATIONS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Engineered for Clinical Zero-Tolerance Environments
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tile 1 */}
            <div className="doppelrand-shell t-card-hover">
              <div className="doppelrand-core p-6 h-full flex flex-col justify-between space-y-4">
                <div className="specular-hairline" />
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-950 dark:text-white mb-1">
                    Atomic Mutex Booking
                  </h3>
                  <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Database isolation ensures every time slot has a mathematical guarantee against overlapping consultations.
                  </p>
                </div>
                <div className="pt-2 font-mono-code text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                  0% DOUBLE-BOOK RATE
                </div>
              </div>
            </div>

            {/* Tile 2 */}
            <div className="doppelrand-shell t-card-hover">
              <div className="doppelrand-core p-6 h-full flex flex-col justify-between space-y-4">
                <div className="specular-hairline" />
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-950 dark:text-white mb-1">
                    Dynamic Practice Overrides
                  </h3>
                  <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Physicians can configure recurrent standard windows or mark instant single-date calendar leaves.
                  </p>
                </div>
                <div className="pt-2 font-mono-code text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  CALENDAR OVERRIDE ENGINE
                </div>
              </div>
            </div>

            {/* Tile 3 */}
            <div className="doppelrand-shell t-card-hover">
              <div className="doppelrand-core p-6 h-full flex flex-col justify-between space-y-4">
                <div className="specular-hairline" />
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-950 dark:text-white mb-1">
                    Cryptographic Data Security
                  </h3>
                  <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Patient symptoms and physician remarks are protected by authenticated JWT sessions and role-gated endpoints.
                  </p>
                </div>
                <div className="pt-2 font-mono-code text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                  TLS 1.3 · STRICT RBAC
                </div>
              </div>
            </div>

            {/* Tile 4 */}
            <div className="doppelrand-shell t-card-hover">
              <div className="doppelrand-core p-6 h-full flex flex-col justify-between space-y-4">
                <div className="specular-hairline" />
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <UsersThree size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-zinc-950 dark:text-white mb-1">
                    Tri-Persona Coordination
                  </h3>
                  <p className="font-body text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Tailored views for Patients (booking & ledger), Doctors (practice matrix), and Admins (telemetry console).
                  </p>
                </div>
                <div className="pt-2 font-mono-code text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  UNIFIED PLATFORM
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Final CTA */}
      <section className="py-20">
        <div className="w-full max-w-[1450px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="doppelrand-shell">
            <div className="doppelrand-core p-10 sm:p-14 text-center">
              <div className="specular-hairline" />
              <div className="max-w-2xl mx-auto">
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white mb-3">
                  Ready to coordinate your clinical visits?
                </h2>
                <p className="font-body text-zinc-600 dark:text-zinc-400 text-sm sm:text-base mb-8 leading-relaxed">
                  Join patients and leading medical providers managing appointments with institutional precision.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    to="/register"
                    className="h-11 pl-6 pr-2 inline-flex items-center justify-center gap-3 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs sm:text-sm tracking-tight transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-sm"
                  >
                    <span>Create Your Account</span>
                    <span className="w-7 h-7 rounded-lg bg-white/15 dark:bg-zinc-950/10 flex items-center justify-center">
                      <ArrowUpRight size={14} weight="bold" />
                    </span>
                  </Link>
                  <Link
                    to="/login"
                    className="h-11 px-6 inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Minimalist Clinical Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#07080A] py-10 transition-colors">
        <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono-code gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/25">
                <svg
                  width="16"
                  height="16"
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
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#07080A]" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base tracking-tight text-zinc-950 dark:text-white leading-none">
                  Dead<span className="text-sky-600 dark:text-sky-400">Lines</span>
                </span>
                <span className="font-mono-code text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                  Clinical Precision
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono-code text-[11px] text-zinc-400 dark:text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>TLS 1.3 · High-Throughput Clinical Orchestration</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
