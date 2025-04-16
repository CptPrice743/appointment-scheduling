import React from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
// Corrected CSS import path assuming the CSS is in the same directory
import "./Home.css";

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) return null;

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Deadlines</h1>
        <p>Book faster. Stress less. Live to see your next birthday.</p>

        <div className="cta-buttons">
          <Link to="/register" className="cta-button register">
            Create Account
          </Link>
          <Link to="/login" className="cta-button login">
            Login
          </Link>
        </div>
      </div>

      <div className="features-section">
        <div className="feature">
          <h3>Easy Scheduling</h3>
          <p>
            Pick your doc. Pick a time. Pray they’re not running an hour late.
          </p>
        </div>

        <div className="feature">
          <h3>Smart Conflict Detection</h3>
          <p>
            We’ll stop you from booking back-to-back with the same doc. No time
            conflicts here.
          </p>
        </div>

        <div className="feature">
          <h3>Appointment Management</h3>
          <p>
            View, edit, or cancel your appointments before your doctor
            ghostwrites your chart note.
          </p>
        </div>

        <div className="feature">
          <h3>Automated Reminders</h3>
          <p>
            We’ll remind you before your body does. Stay ahead of those yearly
            checkups.
          </p>
        </div>

        <div className="feature">
          <h3>Personal Dashboard</h3>
          <p>See all your upcoming and past appointments in one clean view.</p>
        </div>

        <div className="feature">
          <h3>Secure User Accounts</h3>
          <p>
            Your data is protected. Login, logout, and register with peace of
            mind.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
