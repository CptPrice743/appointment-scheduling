import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Core Components & Context
import Navbar from "./components/Navbar/Navbar.jsx";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
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
import UserManagement from "./pages/admin/UserManagement.jsx";
import DoctorManagement from "./pages/admin/DoctorManagement.jsx";
import AppointmentOversight from "./pages/admin/AppointmentOversight.jsx";

// Global Styles
import "./index.css"; // Correct path

// Helper component to redirect based on role after login
const RoleBasedRedirect = () => {
  const { user, isLoading } = React.useContext(AuthContext);

  if (isLoading) {
    return <div className="loading">Loading...</div>; // Or null, or spinner
  }

  if (user?.role === "doctor") {
    return <Navigate to="/doctor/dashboard" replace />;
  }
  // Default redirect for patients or if role is unknown/loading failed
  return <Navigate to="/appointments" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
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
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/doctors" element={<DoctorManagement />} />
                <Route
                  path="/admin/appointments"
                  element={<AppointmentOversight />}
                />
              </Route>
              {/* Catch-all Route - Redirects unauthenticated to home, authenticated to their dashboard */}
              <Route
                path="*"
                element={
                  <AuthContext.Consumer>
                    {" "}
                    {/* [cite: 31] */}
                    {({ isAuthenticated }) =>
                      isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    }
                  </AuthContext.Consumer>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider> /* [cite: 31] */
  );
}

export default App;
