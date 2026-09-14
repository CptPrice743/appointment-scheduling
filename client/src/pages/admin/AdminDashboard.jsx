import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format } from "date-fns";
import {
  CalendarCheck,
  Clock,
  UserPlus,
  Pulse,
  ChartBar,
  ChartPieSlice,
  ShieldCheck,
  TrendUp,
  WarningCircle,
  UsersThree,
  FirstAid,
  ArrowUpRight,
} from "@phosphor-icons/react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Cold Luxury Clinical Status Colors
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "scheduled":
      return "rgba(56, 189, 248, 0.85)"; // Sky
    case "completed":
      return "rgba(16, 185, 129, 0.85)"; // Emerald
    case "cancelled":
      return "rgba(244, 63, 94, 0.85)"; // Rose
    case "pending":
      return "rgba(245, 158, 11, 0.85)"; // Amber
    case "noshow":
      return "rgba(113, 113, 122, 0.85)"; // Zinc
    default:
      return "rgba(148, 163, 184, 0.85)";
  }
};

const getStatusBorderColor = (status) => {
  switch (status?.toLowerCase()) {
    case "scheduled":
      return "rgb(56, 189, 248)";
    case "completed":
      return "rgb(16, 185, 129)";
    case "cancelled":
      return "rgb(244, 63, 94)";
    case "pending":
      return "rgb(245, 158, 11)";
    case "noshow":
      return "rgb(113, 113, 122)";
    default:
      return "rgb(148, 163, 184)";
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    appointmentsPerDoctor: [],
    appointmentsByStatus: [],
    upcomingAppointments: 0,
    newUserRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { axiosInstance } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL || "/api";

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axiosInstance.get(
          "/admin/stats/dashboard"
        );
        setStats({
          totalAppointments: response.data.totalAppointments || 0,
          appointmentsPerDoctor: response.data.appointmentsPerDoctor || [],
          appointmentsByStatus: response.data.appointmentsByStatus || [],
          upcomingAppointments: response.data.upcomingAppointments || 0,
          newUserRegistrations: response.data.newUserRegistrations || 0,
        });
      } catch (err) {
        console.error("Error fetching admin dashboard stats:", err);
        setError(
          err.response?.data?.message || "Failed to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [axiosInstance, API_URL]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // 1. Appointments Per Doctor
  const appointmentsPerDoctorChartData = {
    labels: stats.appointmentsPerDoctor.map(
      (doc) => doc.doctorName || "Unknown"
    ),
    datasets: [
      {
        label: "Consultation Volume",
        data: stats.appointmentsPerDoctor.map((doc) => doc.count),
        backgroundColor: "rgba(56, 189, 248, 0.7)",
        borderColor: "rgb(56, 189, 248)",
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const appointmentsPerDoctorChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(13, 16, 22, 0.95)",
        titleFont: { family: "Geist Mono", size: 12 },
        bodyFont: { family: "Geist", size: 12 },
        padding: 10,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#71717A",
          font: { family: "Geist Mono", size: 11 },
        },
      },
      y: {
        grid: { color: "rgba(113, 113, 122, 0.1)" },
        ticks: {
          color: "#71717A",
          font: { family: "Geist Mono", size: 11 },
          stepSize: 1,
        },
      },
    },
  };

  // 2. Status Distribution
  const appointmentsByStatusChartData = {
    labels: stats.appointmentsByStatus.map((item) => {
      const s = item.status || item._id || "Unknown";
      return s.charAt(0).toUpperCase() + s.slice(1);
    }),
    datasets: [
      {
        data: stats.appointmentsByStatus.map((item) => item.count),
        backgroundColor: stats.appointmentsByStatus.map((item) =>
          getStatusColor(item.status || item._id)
        ),
        borderColor: stats.appointmentsByStatus.map((item) =>
          getStatusBorderColor(item.status || item._id)
        ),
        borderWidth: 1.5,
      },
    ],
  };

  const appointmentsByStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#71717A",
          font: { family: "Geist Mono", size: 11 },
          padding: 14,
          usePointStyle: true,
        },
      },
    },
    cutout: "72%",
  };

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 animate-materialize">
      {/* Header & Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-white/[0.08] mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono-code text-[10px] uppercase font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Institutional Telemetry
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Administrative Command Console
          </h1>
          <p className="font-body text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            System overview, clinical metrics, and multi-specialty appointment throughput.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-100/70 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 text-xs font-mono-code">
          <Clock size={14} />
          <span>{format(currentTime, "EEE, MMM d, yyyy HH:mm:ss")}</span>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono-code">
          {error}
        </div>
      )}

      {/* KPI Cards in Double-Bezel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="doppelrand-shell">
          <div className="doppelrand-core p-5 flex items-center justify-between">
            <div className="specular-hairline" />
            <div>
              <p className="text-[10px] font-mono-code uppercase font-semibold tracking-wider text-zinc-400">
                Total Consultations
              </p>
              <h3 className="font-display text-2xl font-bold text-zinc-950 dark:text-white mt-1">
                {stats.totalAppointments}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <CalendarCheck size={20} weight="regular" />
            </div>
          </div>
        </div>

        <div className="doppelrand-shell">
          <div className="doppelrand-core p-5 flex items-center justify-between">
            <div className="specular-hairline" />
            <div>
              <p className="text-[10px] font-mono-code uppercase font-semibold tracking-wider text-zinc-400">
                Upcoming Confirmed
              </p>
              <h3 className="font-display text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                {stats.upcomingAppointments}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock size={20} weight="regular" />
            </div>
          </div>
        </div>

        <div className="doppelrand-shell">
          <div className="doppelrand-core p-5 flex items-center justify-between">
            <div className="specular-hairline" />
            <div>
              <p className="text-[10px] font-mono-code uppercase font-semibold tracking-wider text-zinc-400">
                Active Clinicians
              </p>
              <h3 className="font-display text-2xl font-bold text-zinc-950 dark:text-white mt-1">
                {stats.appointmentsPerDoctor.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FirstAid size={20} weight="regular" />
            </div>
          </div>
        </div>

        <div className="doppelrand-shell">
          <div className="doppelrand-core p-5 flex items-center justify-between">
            <div className="specular-hairline" />
            <div>
              <p className="text-[10px] font-mono-code uppercase font-semibold tracking-wider text-zinc-400">
                Patient Profiles
              </p>
              <h3 className="font-display text-2xl font-bold text-zinc-950 dark:text-white mt-1">
                {stats.newUserRegistrations}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserPlus size={20} weight="regular" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        <div className="lg:col-span-7 doppelrand-shell">
          <div className="doppelrand-core p-6 h-80 flex flex-col justify-between">
            <div className="specular-hairline" />
            <div className="flex items-center gap-2 text-[11px] font-mono-code uppercase font-semibold text-zinc-400">
              <ChartBar size={14} />
              <span>Physician Consultation Load</span>
            </div>
            <div className="h-56 mt-2">
              <Bar
                data={appointmentsPerDoctorChartData}
                options={appointmentsPerDoctorChartOptions}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 doppelrand-shell">
          <div className="doppelrand-core p-6 h-80 flex flex-col justify-between">
            <div className="specular-hairline" />
            <div className="flex items-center gap-2 text-[11px] font-mono-code uppercase font-semibold text-zinc-400">
              <ChartPieSlice size={14} />
              <span>Status Ledger Distribution</span>
            </div>
            <div className="h-56 mt-2">
              <Doughnut
                data={appointmentsByStatusChartData}
                options={appointmentsByStatusChartOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link to="/admin/users" className="doppelrand-shell group">
          <div className="doppelrand-core p-6 flex items-center justify-between">
            <div className="specular-hairline" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <UsersThree size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                  User Registry
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono-code">Accounts & Roles</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-sky-500 transition-colors" />
          </div>
        </Link>

        <Link to="/admin/doctors" className="doppelrand-shell group">
          <div className="doppelrand-core p-6 flex items-center justify-between">
            <div className="specular-hairline" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FirstAid size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                  Doctor Directory
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono-code">Physicians & Specialties</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
          </div>
        </Link>

        <Link to="/admin/appointments" className="doppelrand-shell group">
          <div className="doppelrand-core p-6 flex items-center justify-between">
            <div className="specular-hairline" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <CalendarCheck size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                  Appointment Ledger
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono-code">Global Consultation Audit</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-zinc-400 group-hover:text-purple-500 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
