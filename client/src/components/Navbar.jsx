import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Deadlines
        </Link>
        <ul className="nav-menu">
          {!isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/" className="nav-links">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/add" className="nav-links book-btn">
                  Book Appointment
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/appointments" className="nav-links">
                  View Appointments
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/add" className="nav-links book-btn">
                  Schedule Appointment
                </Link>
              </li>
              <li className="nav-item">
                <a href="#!" onClick={logout} className="nav-links">
                  Logout
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
