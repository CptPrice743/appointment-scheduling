import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../../context/AuthContext";
import "./AdminDashboard.css"; // Import the CSS file
import { Bar, Doughnut } from "react-chartjs-2"; // Import Doughnut
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, // Import ArcElement for Doughnut/Pie
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format } from "date-fns"; // For formatting date/time

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, // Register ArcElement
  Title,
  Tooltip,
  Legend
);

// Helper function to get status colors (customize as needed)
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "scheduled":
      return "rgba(0, 123, 255, 0.7)"; // Blue
    case "completed":
      return "rgba(40, 167, 69, 0.7)"; // Green
    case "cancelled":
      return "rgba(220, 53, 69, 0.7)"; // Red
    case "pending":
      return "rgba(255, 193, 7, 0.7)"; // Yellow
    default:
      return "rgba(108, 117, 125, 0.7)"; // Gray
  }
};
// Generate border colors slightly darker/opaque
const getStatusBorderColor = (status) => {
  switch (status?.toLowerCase()) {
    case "scheduled":
      return "rgba(0, 123, 255, 1)";
    case "completed":
      return "rgba(40, 167, 69, 1)";
    case "cancelled":
      return "rgba(220, 53, 69, 1)";
    case "pending":
      return "rgba(255, 193, 7, 1)";
    default:
      return "rgba(108, 117, 125, 1)";
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    appointmentsPerDoctor: [],
    appointmentsByStatus: [], // Initialize state for status data
    upcomingAppointments: 0,
    newUserRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date()); // For the clock
  const { axiosInstance } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Effect for fetching stats
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axiosInstance.get(
          `${API_URL}/admin/stats/dashboard`
        );
        setStats({
          totalAppointments: response.data.totalAppointments || 0,
          appointmentsPerDoctor: response.data.appointmentsPerDoctor || [],
          appointmentsByStatus: response.data.appointmentsByStatus || [], // Set status data
          upcomingAppointments: response.data.upcomingAppointments || 0,
          newUserRegistrations: response.data.newUserRegistrations || 0,
        });
        console.log(
          "Frontend - Received appointmentsByStatus:",
          response.data.appointmentsByStatus
        );
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

  // Effect for updating time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    // Cleanup interval on component unmount
    return () => clearInterval(timerId);
  }, []);

  // --- Chart Data Preparation ---

  // 1. Appointments Per Doctor (Bar Chart)
  const appointmentsPerDoctorChartData = {
    labels: stats.appointmentsPerDoctor.map(
      (doc) => doc.doctorName || "Unknown"
    ),
    datasets: [
      {
        label: "Appointments Count",
        data: stats.appointmentsPerDoctor.map((doc) => doc.count),
        backgroundColor: "rgba(0, 123, 255, 0.6)",
        borderColor: "rgba(0, 123, 255, 1)",
        borderWidth: 1,
      },
    ],
  };
  const appointmentsPerDoctorChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } },
  };

  // 2. Appointments By Status (Doughnut Chart)
  const appointmentsByStatusChartData = {
    labels: stats.appointmentsByStatus.map(
      (item) => item.status.charAt(0).toUpperCase() + item.status.slice(1)
    ), // Capitalize status
    datasets: [
      {
        label: "Appointments by Status",
        data: stats.appointmentsByStatus.map((item) => item.count),
        backgroundColor: stats.appointmentsByStatus.map((item) =>
          getStatusColor(item.status)
        ),
        borderColor: stats.appointmentsByStatus.map((item) =>
          getStatusBorderColor(item.status)
        ),
        borderWidth: 1,
        hoverOffset: 4, // Slight grow effect on hover
      },
    ],
  };
  const appointmentsByStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right", // Position legend to the side
        labels: {
          padding: 15, // Add some padding to legend items
        },
      },
      title: {
        display: true,
        text: "Appointments Distribution by Status",
        font: { size: 16 },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        callbacks: {
          // Optional: Customize tooltip label
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            // You could add percentages here if desired
            // const total = context.dataset.data.reduce((acc, value) => acc + value, 0);
            // const percentage = ((context.parsed / total) * 100).toFixed(1) + '%';
            // label += ` (${percentage})`;
            return label;
          },
        },
      },
    },
    cutout: "60%", // Make it a doughnut chart (adjust percentage for thickness)
  };

  // --- Render Logic ---
  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="message error">{error}</div>;

  return (
    <div className="admin-dashboard-container">
      {/* Header Area */}
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        {/* Creative Twist: Live Clock & Location Context */}
        <div className="dashboard-context">
          <span>{format(currentTime, "PPpp")}</span>{" "}
          {/* Format: Apr 18, 2025, 6:04:27 AM */}
          <span>Gandhidham, Gujarat, India</span> {/* Hardcoded Location */}
        </div>
      </div>

      {/* Grid for Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p>{stats.totalAppointments}</p>
        </div>
        <div className="stat-card">
          <h3>Upcoming Appointments</h3>
          <p>{stats.upcomingAppointments}</p>
        </div>
        <div className="stat-card">
          <h3>New Users (Last 7 days)</h3>
          <p>{stats.newUserRegistrations}</p>
        </div>
        {/* Add more stat cards here if needed */}
      </div>

      {/* Grid for Charts */}
      <div className="charts-grid">
        {" "}
        {/* New grid specifically for charts */}
        {/* Appointments by Status Chart */}
        {stats.appointmentsByStatus.length > 0 ? (
          <div className="chart-container doughnut-container">
            {" "}
            {/* Use a specific class */}
            {/* Title moved to chart options */}
            <div style={{ height: "350px", position: "relative" }}>
              {" "}
              {/* Adjusted height */}
              <Doughnut
                options={appointmentsByStatusChartOptions}
                data={appointmentsByStatusChartData}
              />
            </div>
          </div>
        ) : (
          <div className="chart-container doughnut-container">
            <h3>Appointments Distribution by Status</h3>
            <p>No appointment status data available.</p>
          </div>
        )}
        {/* Appointments Per Doctor Chart */}
        {stats.appointmentsPerDoctor.length > 0 ? (
          <div className="chart-container bar-container">
            {" "}
            {/* Use a specific class */}
            <h3>Appointments Per Doctor</h3>
            <div style={{ height: "350px", position: "relative" }}>
              {" "}
              {/* Adjusted height */}
              <Bar
                options={appointmentsPerDoctorChartOptions}
                data={appointmentsPerDoctorChartData}
              />
            </div>
          </div>
        ) : (
          <div className="chart-container bar-container">
            <h3>Appointments Per Doctor</h3>
            <p>No appointment data available for doctors.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
