import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios"; // Using axios for consistency if preferred

const AuthContext = createContext();

// Use environment variable for API base URL if available
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );
  const [user, setUser] = useState(() => {
    // <-- The actual state setter function
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error("Error parsing stored user data:", err);
      localStorage.removeItem("user"); // Clear invalid data
      localStorage.removeItem("token"); // Also clear token if user data is bad
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const [error, setError] = useState(null);

  // Effect to update isAuthenticated when token changes
  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  // Configure axios instance to include token
  const axiosInstance = axios.create({
    baseURL: API_URL,
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.post("/auth/login", {
          email,
          password,
        });
        const { token: receivedToken, user: receivedUser } = res.data;

        localStorage.setItem("token", receivedToken);
        localStorage.setItem("user", JSON.stringify(receivedUser));

        setToken(receivedToken);
        setUser(receivedUser); // Update state
        console.log("Login successful, user role:", receivedUser?.role);
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || "Login failed";
        console.error("Login Error:", message);
        setError(message);
        // Ensure state reflects failed login
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    },
    [axiosInstance]
  ); // setUser doesn't need to be a dependency here

  const register = useCallback(
    async (userData) => {
      setIsLoading(true);
      setError(null);
      try {
        // Include role in registration data
        const res = await axiosInstance.post("/auth/register", userData);
        const { token: receivedToken, user: receivedUser } = res.data;

        localStorage.setItem("token", receivedToken);
        localStorage.setItem("user", JSON.stringify(receivedUser));

        setToken(receivedToken);
        setUser(receivedUser); // Update state
        console.log("Registration successful, user role:", receivedUser?.role);
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || "Registration failed";
        console.error("Registration Error:", message);
        setError(message);
        // Ensure state reflects failed registration
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    },
    [axiosInstance]
  ); // setUser doesn't need to be a dependency here

  const logout = useCallback(() => {
    console.log("Logging out user...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null); // Clear user state
    setError(null);
  }, []); // setUser doesn't need to be a dependency here

  const clearError = useCallback(() => setError(null), []);

  // Memoize the context value
  // ** FIX: Added setUser to the context value object and dependency array **
  const contextValue = React.useMemo(
    () => ({
      token,
      user,
      setUser, // <-- Add the setUser function here
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
      axiosInstance,
    }),
    [
      token,
      user,
      setUser,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
      axiosInstance,
    ]
  ); // <-- Add setUser to dependency array

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext }; // Export AuthContext directly
export default AuthContext; // Keep default export for convenience
