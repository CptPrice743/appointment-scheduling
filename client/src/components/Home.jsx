import React from 'react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);


  if (isAuthenticated) return null; // Do not show Home content to logged-in users

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Deadlines</h1>
        <p>Book faster. Stress less. Live to see your next birthday.</p>
        
        {!isAuthenticated && (
          <div className="cta-buttons">
            <Link to="/register" className="cta-button register">
              Create Account
            </Link>
            <Link to="/login" className="cta-button login">
              Login
            </Link>
          </div>
        )}

      </div>

      <div className="features-section">
        <div className="feature">
          <h3>Easy Scheduling</h3>
          <p>Pick your doc. Pick a time. Pray they’re not running an hour late.</p>
        </div>
        <div className="feature">
          <h3>Appointment Management</h3>
          <p>View, edit, or cancel your appointments before your doctor ghostwrites your chart note</p>
        </div>
        <div className="feature">
          <h3>Reminders</h3>
          <p>We’ll remind you before your body does</p>
        </div>
      </div>
    </div>
  );
};

export default Home;