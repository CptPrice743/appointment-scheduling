import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import AuthContext from "../context/AuthContext.jsx";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;
  const { login, isAuthenticated, error, clearError, isLoading, user } =
    useContext(AuthContext); // Add user and isLoading
  const navigate = useNavigate();
  const location = useLocation(); // Get location to redirect back after login if needed

  const from = location.state?.from?.pathname || "/dashboard"; // Default redirect or from location state

  useEffect(() => {
    // If authenticated, redirect based on role using the /dashboard redirector
    if (isAuthenticated) {
      navigate(from, { replace: true }); // Redirect to where they came from or dashboard
    }
  }, [isAuthenticated, navigate, from, user]); // Add user to dependencies

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    // Navigation is handled by the useEffect hook
  };

  return (
    <div className="appointment-form-container">
      <h2>Login</h2>

      {error && <div className="message error">{error}</div>}

      <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            required
            disabled={isLoading} // Disable during loading
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            required
            minLength="6" // Keep minLength for consistency
            disabled={isLoading} // Disable during loading
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Login;
