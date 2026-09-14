import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ScheduleView from "../components/ScheduleView/ScheduleView";
import { Stethoscope, CalendarCheck, Clock, ArrowUpRight } from "@phosphor-icons/react";

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== "doctor") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center font-mono-code text-xs text-zinc-500">
        Authenticating physician clinical credentials...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 animate-materialize">
      {/* Physician Clinical Status Banner in Double-Bezel */}
      <div className="doppelrand-shell mb-8">
        <div className="doppelrand-core p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="specular-hairline" />

          <div className="flex items-start sm:items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xl font-display shadow-xs">
              {user.name ? user.name.replace(/^Dr\.\s*/i, "").charAt(0) : "D"}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-radar-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-[#131720]" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                  Welcome, Dr. {user.name.replace(/^Dr\.\s*/i, "")}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold font-mono-code">
                  <Stethoscope size={13} />
                  {user.doctorProfile?.specialization || "General Medicine"}
                </span>
                <span className="flex items-center gap-1 font-mono-code text-[11px]">
                  <Clock size={13} />
                  <span>Slot Duration:</span>
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {user.doctorProfile?.appointmentDuration || "30"}m
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/profile/edit"
              className="h-9 px-4 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all shadow-xs"
            >
              <span>Practice Hours & Overrides</span>
              <ArrowUpRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      </div>

      {/* Schedule Matrix */}
      <ScheduleView />
    </div>
  );
};

export default DoctorDashboard;
