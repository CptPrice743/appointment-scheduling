// client/src/components/Auth/AdminRoute.jsx
import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext"; // Adjust path as needed

const AdminRoute = () => {
  const { isAuthenticated, user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    // Show a loading indicator while authentication status is being checked
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated, saving the intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "admin") {
    // Redirect to a 'forbidden' page or dashboard if authenticated but not an admin
    console.warn("AdminRoute Access Denied: User is not an admin.");
    // return <Navigate to="/forbidden" replace />; // Or redirect to user dashboard
    return <Navigate to="/dashboard" replace />; // Redirect non-admins away
  }

  // If authenticated and is an admin, render the child component
  return <Outlet />;
};

export default AdminRoute;
