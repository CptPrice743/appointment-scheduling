import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import AppointmentList from "./components/AppointmentList"; // Patient's List
import AppointmentForm from "./components/AppointmentForm";
import Login from "./components/Login";
import Register from "./components/Register";
import DoctorDashboard from "./components/DoctorDashboard"; // Doctor's Dashboard
import UserProfileEdit from './components/UserProfileEdit';
// Import AvailabilityManager if you create a separate route for it
// import AvailabilityManager from './components/AvailabilityManager';
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx"; // Import AuthContext too
import PrivateRoute from "./components/PrivateRoute.jsx";
import DoctorRoute from "./components/DoctorRoute.jsx"; // Import DoctorRoute
import "./index.css";

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
              <Route path="/register" element={<Register />} />

              {/* === PATIENT Routes === */}
              <Route
                path="/appointments" // Patient's appointment list
                element={
                  <PrivateRoute>
                    {" "}
                    {/* Ensures logged in */}
                    {/* We might add a check here or in the component to ensure role is patient */}
                    <AppointmentList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/add" // Patient books an appointment
                element={
                  <PrivateRoute>
                    {/* AppointmentForm can handle patient context */}
                    <AppointmentForm />
                  </PrivateRoute>
                }
              />
              {/* Patient might edit/view their own appointment details */}
              {/* The GET /:id and PATCH /:id routes handle authorization */}
              <Route
                path="/edit/:id"
                element={
                  <PrivateRoute>
                    <AppointmentForm />
                  </PrivateRoute>
                }
              />

              {/* === USER PROFILE Route === */}
              <Route
                path="/profile/edit"
                element={
                  <PrivateRoute>
                    {" "}
                    {/* Ensures logged in */}
                    <UserProfileEdit />
                  </PrivateRoute>
                }
              />

              {/* === DOCTOR Routes === */}
              <Route
                path="/doctor/dashboard"
                element={
                  <DoctorRoute>
                    {" "}
                    {/* Ensures logged in AND role is doctor */}
                    <DoctorDashboard />
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
                    <AvailabilityManager />
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
                    <RoleBasedRedirect />
                  </PrivateRoute>
                }
              />

              {/* Catch-all Route - Redirects unauthenticated to home, authenticated to their dashboard */}
              <Route
                path="*"
                element={
                  <AuthContext.Consumer>
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
    </AuthProvider>
  );
}

export default App;
