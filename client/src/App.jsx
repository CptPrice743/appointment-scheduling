import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Core Components & Context
import Navbar from "./components/Navbar/Navbar.jsx";
import DemoBanner from "./components/DemoBanner.jsx";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import PrivateRoute from "./components/Auth/PrivateRoute.jsx";
import DoctorRoute from "./components/Auth/DoctorRoute.jsx";
import AdminRoute from "./components/Auth/AdminRoute.jsx";

// Page Components (Corrected Paths)
import Home from "./pages/Home.jsx";
import AppointmentList from "./pages/AppointmentList.jsx"; // Patient's List
import AppointmentForm from "./pages/AppointmentForm.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx"; // Doctor's Dashboard
import UserProfileEdit from "./pages/UserProfileEdit.jsx";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import DoctorManagement from "./pages/admin/DoctorManagement.jsx";
import AppointmentOversight from "./pages/admin/AppointmentOversight.jsx";

// Global Styles
import "./index.css"; // Correct path

// Helper component for role-based redirection from /dashboard
const RoleBasedRedirect = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "doctor") {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  // Default redirect for patients or if role is unknown/loading failed
  return <Navigate to="/appointments" replace />;
};

const CatchAllRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/" replace />
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-[100dvh] flex flex-col bg-[#F8F9FA] text-[#090A0C] dark:bg-[#07080A] dark:text-[#F4F5F7] transition-colors duration-300 antialiased selection:bg-sky-500/20 selection:text-sky-600 dark:selection:text-sky-300">
            <DemoBanner />
            <Navbar />
            <main className="flex-1 w-full relative">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />{" "}
            {/* === PATIENT Routes === */}
            <Route
              path="/appointments" // Patient's appointment list
              element={
                <PrivateRoute>
                  {" "}
                  {/* We might add a check here or in the component to ensure role is patient */}
                  <AppointmentList />
                </PrivateRoute>
              }
            />
            <Route
              path="/add" // Patient books an appointment
              element={
                <PrivateRoute>
                  {" "}
                  {/* [cite: 24] */}
                  {/* AppointmentForm can handle patient context */}
                  <AppointmentForm /> {/* [cite: 20] */}
                </PrivateRoute>
              }
            />
            {/* Patient might edit/view their own appointment details */}
            {/* The GET /:id and PATCH /:id routes handle authorization */}
            <Route
              path="/edit/:id"
              element={
                <PrivateRoute>
                  {" "}
                  {/* [cite: 24] */}
                  <AppointmentForm /> {/* [cite: 20] */}
                </PrivateRoute>
              }
            />
            {/* === USER PROFILE Route === */}
            <Route
              path="/profile/edit"
              element={
                <PrivateRoute>
                  {" "}
                  {/* [cite: 24] */}
                  {/* Ensures logged in */}
                  <UserProfileEdit /> {/* [cite: 6] */}
                </PrivateRoute>
              }
            />
            {/* === DOCTOR Routes === */}
            <Route
              path="/doctor/dashboard"
              element={
                <DoctorRoute>
                  {" "}
                  {/* [cite: 23] */}
                  {/* Ensures logged in AND role is doctor */}
                  <DoctorDashboard /> {/* [cite: 8] */}
                </DoctorRoute>
              }
            />
            {/* Add routes for doctor-specific actions if needed */}
            {/* Example: Route for managing availability */}
            {/*
              <Route
                path="/doctor/availability"
                element={
                  <DoctorRoute>
                    <AvailabilityManager /> // You would need to import this if used
                  </DoctorRoute>
                }
              />
              */}
            {/* === Post-Login Redirect === */}
            {/* Route to redirect users after login based on their role */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  {" "}
                  {/* [cite: 24] */}
                  <RoleBasedRedirect />
                </PrivateRoute>
              }
            />
            {/* *** Admin Specific Routes *** */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/doctors" element={<DoctorManagement />} />
              <Route
                path="/admin/appointments"
                element={<AppointmentOversight />}
              />
            </Route>
            <Route
              path="/appointments/book"
              element={<Navigate to="/add" replace />}
            />
            {/* Catch-all Route - Redirects unauthenticated to home, authenticated to their dashboard */}
            <Route path="*" element={<CatchAllRoute />} />
          </Routes>
        </main>
      </div>
    </Router>
  </AuthProvider>
</ThemeProvider>
  );
}

export default App;
