import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

const DoctorRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    // Optional: Show a loading spinner while auth state is being determined
    return <div className="loading">Authenticating...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "doctor") {
    // Optional: Redirect non-doctors to their default page or show an error
    console.warn("Access denied: Doctor role required for this route.");
    return <Navigate to="/appointments" replace />; // Redirect patient to their appointments
    // Or show an error component: return <SomeErrorComponent message="Access Denied"/>;
  }

  // If authenticated and is a doctor, render the child components
  return children;
};

export default DoctorRoute;
