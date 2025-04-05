import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Doctor Appointment Scheduler
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-links">View Appointments</Link>
          </li>
          <li className="nav-item">
            <Link to="/add" className="nav-links">Schedule Appointment</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
