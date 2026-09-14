import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import AuthContext from "../context/AuthContext";
import {
  CalendarCheck,
  ShieldCheck,
  ArrowUpRight,
  Stethoscope,
  UsersThree,
  Sparkle,
  LockSimple,
  User,
  Star,
  Cpu,
  CheckCircle,
  Database,
} from "@phosphor-icons/react";

const CLINIC_DOCTORS = [
  {
    id: "sarah",
    name: "Dr. Sarah Connor",
    spec: "Cardiology",
    suite: "Suite 101 · Cardio Lab",
    status: "Active Practice",
    rating: "4.98",
    reviews: 142,
    initials: "SC",
    badge: "Lead Cardiologist",
    duration: "30m",
    nextSlot: "09:00 AM Today",
    slots: ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM"],
    focus: "Arrhythmia, Coronary Assessment, Hemodynamics",
  },
  {
    id: "house",
    name: "Dr. Gregory House",
    spec: "Diagnostic Medicine",
    suite: "Suite 102 · Pathology Wing",
    status: "Consulting",
    rating: "4.92",
    reviews: 119,
    initials: "GH",
    badge: "Dept. Chair",
    duration: "45m",
    nextSlot: "11:00 AM Today",
    slots: ["11:00 AM", "01:15 PM", "02:45 PM"],
    focus: "Differential Diagnostic Audit, Autoimmune Pathology",
  },
  {
    id: "cuddy",
    name: "Dr. Lisa Cuddy",
    spec: "Endocrinology",
    suite: "Suite 103 · Endocrine Center",
    status: "Accepting Intake",
    rating: "4.99",
    reviews: 168,
    initials: "LC",
    badge: "Dean of Medicine",
    duration: "30m",
    nextSlot: "08:30 AM Tomorrow",
    slots: ["08:30 AM", "10:30 AM", "01:00 PM"],
    focus: "Metabolic Regulation, Thyroid Endocrinology",
  },
  {
    id: "wilson",
    name: "Dr. James Wilson",
    spec: "Oncology",
    suite: "Suite 104 · Clinical Oncology",
    status: "In Consultation",
    rating: "4.97",
    reviews: 134,
    initials: "JW",
    badge: "Head of Oncology",
    duration: "45m",
    nextSlot: "09:30 AM Today",
    slots: ["09:30 AM", "11:00 AM", "02:30 PM"],
    focus: "Histology Diagnostics, Clinical Protocol Oversight",
  },
];

const SCHEDULE_LEDGER_ITEMS = [
  {
    time: "08:30 - 09:15",
    doctor: "Dr. Lisa Cuddy",
    spec: "Endocrinology",
    patient: "Patient D. M.",
    suite: "Suite 103",
    status: "COMPLETED",
    badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-400 border-zinc-200 dark:border-white/10",
  },
  {
    time: "09:00 - 09:45",
    doctor: "Dr. Sarah Connor",
    spec: "Cardiology",
    patient: "Patient E. V.",
    suite: "Suite 101",
    status: "IN CONSULTATION",
    isLive: true,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    time: "10:00 - 10:30",
    doctor: "Dr. Sarah Connor",
    spec: "Cardiology",
    patient: "Patient J. D.",
    suite: "Suite 101",
    status: "MUTEX SECURED",
    tag: "11ms Commit",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  {
    time: "11:00 - 11:45",
    doctor: "Dr. Gregory House",
    spec: "Diagnostics",
    patient: "Pending Intake",
    suite: "Suite 102",
    status: "CONFIRMED",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  {
    time: "01:15 - 02:00",
    doctor: "Dr. James Wilson",
    spec: "Oncology",
    patient: "Patient R. T.",
    suite: "Suite 104",
    status: "SCHEDULED",
    badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-400 border-zinc-200 dark:border-white/10",
  },
];

const Home = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleQuickDemo = async (email, password, route) => {
    try {
      await login(email, password);
      navigate(route);
    } catch (err) {
      console.error("Demo login failed:", err);
    }
  };

  const staggerTransition = {
    duration: 0.35,
    ease: [0.16, 1, 0.3, 1],
  };

  return (
    <div className="w-full min-h-[100dvh] overflow-x-hidden transition-colors duration-300 bg-[#F8F9FA] dark:bg-[#07080A] text-[#090A0C] dark:text-[#F4F5F7]">
      
      {/* 1. Hero Section: Editorial Asymmetric Split */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden border-b border-zinc-200/80 dark:border-white/[0.06]">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-500/[0.05] dark:bg-sky-500/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-10 w-[420px] h-[420px] bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Bold Typographic Value Proposition */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={staggerTransition}
              className="lg:col-span-5 flex flex-col items-start space-y-6"
            >
              {/* Eyebrow 1 of 2 across page */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-semibold uppercase tracking-[0.16em] font-mono-code">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span>Real-Time Dispatch · Latency &lt; 14ms</span>
              </div>

              {/* Bold Headline */}
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.05]">
                Surgical precision. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 dark:from-sky-400 dark:via-sky-300 dark:to-teal-300">
                  Zero scheduling drag.
                </span>
              </h1>

              {/* Subtext (<20 words, strictly no em-dash) */}
              <p className="font-body text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[50ch]">
                Atomic calendar orchestration and conflict-free mutex locks for institutional healthcare practices and high-throughput clinics.
              </p>

              {/* Primary Actions */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto pt-1">
                <Link
                  to="/register"
                  className="h-11 pl-5 pr-2.5 inline-flex items-center justify-center gap-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm tracking-tight transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-sm group"
                >
                  <span>Schedule Consultation</span>
                  <span className="w-7 h-7 rounded-lg bg-white/15 dark:bg-zinc-950/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight size={14} weight="bold" />
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="h-11 px-5 inline-flex items-center justify-center rounded-xl text-sm font-semibold border border-zinc-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                >
                  Provider Sign In
                </Link>
              </div>

              {/* Sleek 1-Click Quick Demo Evaluation Tier */}
              <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.07]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono-code flex items-center gap-1.5">
                    <Sparkle size={13} weight="fill" />
                    1-Click Quick Demo
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono-code">1-Click Auto Login</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    id="demo-patient-btn"
                    onClick={() => handleQuickDemo("patient.john@example.com", "patientpassword123", "/appointments")}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-[#131720] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-white/10 text-xs font-semibold transition-all shadow-xs hover:border-sky-500/40 cursor-pointer active:scale-[0.98]"
                  >
                    <User size={13} className="text-sky-500 shrink-0" />
                    <span>Patient</span>
                  </button>
                  <button
                    type="button"
                    id="demo-doctor-btn"
                    onClick={() => handleQuickDemo("doctor.sarah@example.com", "doctorpassword123", "/doctor/dashboard")}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-[#131720] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-white/10 text-xs font-semibold transition-all shadow-xs hover:border-sky-500/40 cursor-pointer active:scale-[0.98]"
                  >
                    <Stethoscope size={13} className="text-emerald-500 shrink-0" />
                    <span>Doctor</span>
                  </button>
                  <button
                    type="button"
                    id="demo-admin-btn"
                    onClick={() => handleQuickDemo("admin@example.com", "adminpassword123", "/admin/dashboard")}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white dark:bg-[#131720] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-white/10 text-xs font-semibold transition-all shadow-xs hover:border-sky-500/40 cursor-pointer active:scale-[0.98]"
                  >
                    <ShieldCheck size={13} className="text-amber-500 shrink-0" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Tri-Metric Inline Strip */}
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02]">
                  <span className="font-mono-code text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Lock Latency</span>
                  <span className="font-display font-bold text-base text-zinc-900 dark:text-white">&lt; 12ms</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02]">
                  <span className="font-mono-code text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Collision Rate</span>
                  <span className="font-display font-bold text-base text-emerald-600 dark:text-emerald-400">0.00%</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02]">
                  <span className="font-mono-code text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Architecture</span>
                  <span className="font-display font-bold text-base text-sky-600 dark:text-sky-400">Edge D1</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Architectural Clinical Schedule Ledger Specimen */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...staggerTransition, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <div className="doppelrand-shell shadow-2xl">
                <div className="doppelrand-core p-5 sm:p-6 space-y-4">
                  <div className="specular-hairline" />

                  {/* Specimen Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono-code text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Central Practice Ledger
                      </span>
                      <span className="hidden sm:inline font-mono-code text-[10px] text-zinc-400">
                        · Live Feed
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono-code text-[11px]">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold">
                        D1 Mutex Active
                      </span>
                      <span className="text-zinc-400">Today</span>
                    </div>
                  </div>

                  {/* Operational Telemetry Summary */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04] text-xs font-mono-code text-zinc-600 dark:text-zinc-400">
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase">Specialists</span>
                      <span className="font-bold text-zinc-900 dark:text-white">4 Available</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase">Booked Blocks</span>
                      <span className="font-bold text-zinc-900 dark:text-white">28 Registered</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase">Edge Dispatch</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">9ms Nominal</span>
                    </div>
                  </div>

                  {/* Schedule Ledger Entries */}
                  <div className="space-y-2 pt-1">
                    {SCHEDULE_LEDGER_ITEMS.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isLive
                            ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/30 shadow-xs"
                            : "bg-white dark:bg-[#11151F] border-zinc-200/80 dark:border-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono-code text-xs font-bold text-zinc-500 dark:text-zinc-400 w-24 shrink-0">
                            {item.time}
                          </span>
                          <div className="h-7 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display font-semibold text-xs text-zinc-950 dark:text-white">
                                {item.doctor}
                              </span>
                              <span className="font-mono-code text-[10px] text-zinc-400">
                                ({item.spec})
                              </span>
                            </div>
                            <div className="font-body text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <span>{item.patient}</span>
                              <span>·</span>
                              <span className="font-mono-code">{item.suite}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center font-mono-code text-[10px]">
                          {item.tag && (
                            <span className="text-zinc-400 hidden sm:inline">
                              {item.tag}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold border ${item.badgeClass}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Specimen Sub-Footer */}
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.04] flex items-center justify-between text-[11px] font-mono-code text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <LockSimple size={13} className="text-sky-500" />
                      <span>Zero double-booking guarantee on Cloudflare D1</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Deterministic Mutex
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Active Physician Directory (Architectural Roster Grid) */}
      <section className="py-16 md:py-20 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header (Stacked vertically, respecting Split-Header Ban) */}
          <div className="max-w-3xl mb-12">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Active Physician Directory
            </h2>
            <p className="font-body text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              Four specialized clinical departments operating synchronized consultation schedules with zero booking conflict.
            </p>
          </div>

          {/* Roster 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CLINIC_DOCTORS.map((doc) => (
              <div
                key={doc.id}
                className="doppelrand-shell t-card-hover group"
              >
                <div className="doppelrand-core p-6 h-full flex flex-col justify-between space-y-5">
                  <div className="specular-hairline" />

                  <div>
                    {/* Top Row: Department and Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono-code text-[11px] font-semibold border border-sky-500/20">
                        {doc.spec}
                      </span>
                      <div className="flex items-center gap-1 font-mono-code text-xs text-amber-500">
                        <Star size={13} weight="fill" />
                        <strong className="text-zinc-900 dark:text-white">{doc.rating}</strong>
                        <span className="text-zinc-400">({doc.reviews})</span>
                      </div>
                    </div>

                    {/* Physician Monogram and Identity */}
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
                        {doc.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base sm:text-lg text-zinc-950 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {doc.name}
                          </h3>
                        </div>
                        <p className="font-mono-code text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {doc.badge} · {doc.suite}
                        </p>
                      </div>
                    </div>

                    {/* Clinical Focus */}
                    <p className="font-body text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {doc.focus}
                    </p>
                  </div>

                  {/* Consultation Slots & Action */}
                  <div className="pt-4 border-t border-zinc-200/70 dark:border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono-code">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Windows ({doc.duration} each):
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Next: {doc.nextSlot}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {doc.slots.map((slot) => (
                        <span
                          key={slot}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 font-mono-code text-xs border border-zinc-200/60 dark:border-white/[0.06]"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="font-mono-code text-[11px] text-zinc-400">
                        Institutional Intake
                      </span>
                      <Link
                        to="/register"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 group-hover:translate-x-0.5 transition-all"
                      >
                        <span>Schedule With Specialist</span>
                        <ArrowUpRight size={13} weight="bold" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Concurrency Architecture (Editorial Request Lifecycle Comparison) */}
      <section className="py-16 md:py-24 border-b border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Technical Narrative */}
            <div className="lg:col-span-5 space-y-5">
              {/* Eyebrow 2 of 2 across page */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold uppercase tracking-[0.16em] font-mono-code">
                <Database size={13} weight="bold" />
                <span>Database Isolation</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
                Deterministic Scheduling. Absolute Mutex Guarantees.
              </h2>

              <p className="font-body text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When two patients attempt to claim the identical time window within milliseconds, legacy systems crash or double-book. DeadLines enforces atomic transaction locks at the database layer.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>First-Arrival Mutex Grant:</strong> The leading request secures the exclusive time window in under 12 milliseconds.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle size={18} weight="fill" className="text-sky-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Collision Redirection:</strong> The concurrent request is caught gracefully and routed to the next open slot without error.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle size={18} weight="fill" className="text-purple-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Edge Persistence:</strong> Powered by Cloudflare D1 serverless SQLite transactions with zero spin-down lag.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity Lifecycle Architectural Diagram */}
            <div className="lg:col-span-7">
              <div className="doppelrand-shell">
                <div className="doppelrand-core p-6 sm:p-7 space-y-5">
                  <div className="specular-hairline" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/[0.06] text-xs font-mono-code">
                    <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">
                      Concurrent Dispatch Sequence
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">
                      Slot: Sep 14 · 10:00 AM
                    </span>
                  </div>

                  {/* Timeline Comparison Visual */}
                  <div className="space-y-4">
                    {/* Request A: Winner */}
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold font-mono-code text-[10px] flex items-center justify-center">
                            A
                          </span>
                          <span className="font-display font-semibold text-zinc-950 dark:text-white">
                            Request A (Patient John D.)
                          </span>
                        </div>
                        <span className="font-mono-code text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          T: 10:00:00.012
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-xs font-mono-code">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Status: Mutex Granted · D1 Transaction Committed
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                          LOCKED (11ms)
                        </span>
                      </div>
                    </div>

                    {/* Request B: Graceful Clash Resolution */}
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-bold font-mono-code text-[10px] flex items-center justify-center">
                            B
                          </span>
                          <span className="font-display font-semibold text-zinc-950 dark:text-white">
                            Request B (Patient Emily D.)
                          </span>
                        </div>
                        <span className="font-mono-code text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                          T: 10:00:00.014 (+2ms)
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-xs font-mono-code">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Status: Contention Caught · Redirected to 10:30 AM
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold text-[10px]">
                          CLASH PREVENTED
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3.5 rounded-xl bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Cpu size={14} className="text-sky-500" />
                      <span>Mathematical Zero Double-Book Guarantee</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      0.00% Failure Rate
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Institutional Capabilities Bento (Asymmetric 4-Tile Grid) */}
      <section className="py-16 md:py-24 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Engineered for Clinical Zero-Tolerance Practice
            </h2>
            <p className="font-body text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              Four infrastructural layers ensuring reliable hospital operations, deterministic data locking, and cryptographic patient privacy.
            </p>
          </div>

          {/* Asymmetric Bento: Col-span 7 & 5 on Row 1, Col-span 5 & 7 on Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Tile 1: Hero Deep Tile (Span 7) */}
            <div className="lg:col-span-7 doppelrand-shell t-card-hover">
              <div className="doppelrand-core p-7 h-full flex flex-col justify-between space-y-6 bg-sky-500/[0.03] dark:bg-sky-500/[0.05]">
                <div className="specular-hairline" />
                
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Cpu size={22} weight="bold" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-zinc-950 dark:text-white">
                    Atomic Database Isolation
                  </h3>
                  <p className="font-body text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-[55ch]">
                    Every appointment reservation executes inside an ACID-compliant transaction. Slot overlapping is mathematically eliminated under concurrent load.
                  </p>
                </div>

                {/* Micro Code Specimen: Dark Terminal Surface */}
                <div className="p-3.5 rounded-xl bg-[#090C12] border border-zinc-800 dark:border-white/10 font-mono-code text-[11px] space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/[0.06] text-[10px] text-zinc-500">
                    <span>SQLITE TRANSACTION PROTOCOL</span>
                    <span className="text-emerald-400 font-semibold">ISOLATION: SERIALIZABLE</span>
                  </div>
                  <div className="text-sky-400 font-semibold">BEGIN EXCLUSIVE TRANSACTION;</div>
                  <div className="text-zinc-400">SELECT slot FROM appointments WHERE doctor_id = ? AND date = ?;</div>
                  <div className="text-emerald-400 font-semibold">INSERT INTO appointments (...) VALUES (...); COMMIT;</div>
                </div>
              </div>
            </div>

            {/* Tile 2: Dynamic Practice Overrides (Span 5) */}
            <div className="lg:col-span-5 doppelrand-shell t-card-hover">
              <div className="doppelrand-core p-7 h-full flex flex-col justify-between space-y-5">
                <div className="specular-hairline" />
                
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CalendarCheck size={22} weight="bold" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-zinc-950 dark:text-white">
                    Dynamic Practice Overrides
                  </h3>
                  <p className="font-body text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Physicians establish recurrent weekly consultation slots or register instant date exceptions without disrupting existing confirmed appointments.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 text-xs font-mono-code border border-zinc-200/60 dark:border-white/10">
                    Standard Weekly Hours
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 text-xs font-mono-code border border-zinc-200/60 dark:border-white/10">
                    Single-Date Leave Locks
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 3: Strict Cryptographic Security (Span 5) */}
            <div className="lg:col-span-5 doppelrand-shell t-card-hover">
              <div className="doppelrand-core p-7 h-full flex flex-col justify-between space-y-5">
                <div className="specular-hairline" />
                
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <ShieldCheck size={22} weight="bold" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-zinc-950 dark:text-white">
                    Strict Cryptographic RBAC
                  </h3>
                  <p className="font-body text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Patient medical notes, diagnosis requests, and physician journals are guarded by Web Crypto signed JWTs and strict role authorization.
                  </p>
                </div>

                <div className="pt-2 font-mono-code text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  TLS 1.3 · ZERO UNAUTHORIZED LEAKS
                </div>
              </div>
            </div>

            {/* Tile 4: Tri-Persona Coordination (Span 7) */}
            <div className="lg:col-span-7 doppelrand-shell t-card-hover">
              <div className="doppelrand-core p-7 h-full flex flex-col justify-between space-y-5">
                <div className="specular-hairline" />
                
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <UsersThree size={22} weight="bold" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-zinc-950 dark:text-white">
                    Tri-Persona Clinical Coordination
                  </h3>
                  <p className="font-body text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[55ch]">
                    Dedicated operational workspaces for Patients (direct booking & history), Doctors (practice management), and Admins (institutional oversight).
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono-code text-xs">
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.04] text-zinc-800 dark:text-zinc-200">
                    Patient Portal
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.04] text-zinc-800 dark:text-zinc-200">
                    Physician Matrix
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.04] text-zinc-800 dark:text-zinc-200">
                    Admin Oversight
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Institutional Conversion Banner */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="doppelrand-shell">
            <div className="doppelrand-core p-8 sm:p-14 text-center space-y-6">
              <div className="specular-hairline" />
              
              <div className="max-w-2xl mx-auto space-y-3">
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
                  Ready to coordinate clinical visits?
                </h2>
                <p className="font-body text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                  Join patients and leading healthcare practitioners managing schedules with institutional mathematical precision.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                <Link
                  to="/register"
                  className="h-11 pl-5 pr-2.5 inline-flex items-center justify-center gap-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm tracking-tight transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-sm group"
                >
                  <span>Create Account</span>
                  <span className="w-7 h-7 rounded-lg bg-white/15 dark:bg-zinc-950/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight size={14} weight="bold" />
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="h-11 px-5 inline-flex items-center justify-center rounded-xl text-sm font-semibold border border-zinc-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                >
                  Provider Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Minimalist Clinical Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#07080A] py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
