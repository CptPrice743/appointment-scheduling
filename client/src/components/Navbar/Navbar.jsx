import React, { useState, useContext } from "react"; // Import useState
import { Link, NavLink, useNavigate } from "react-router-dom"; // Import useNavigate
import AuthContext from "../../context/AuthContext.jsx";
import "./Navbar.css";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate(); // Hook for navigation

  // State to manage mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to toggle the mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close the mobile menu (when a link is clicked)
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Updated logout handler to also close the menu and navigate
  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    handleLinkClick(); // Close menu
    navigate("/login"); // Navigate to login after logout
  };

  // Determine the home/dashboard link based on authentication
  const homeLink = isAuthenticated
    ? user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "doctor"
      ? "/doctor/dashboard"
      : "/appointments"
    : "/";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo links to appropriate dashboard or home */}
        <Link to={homeLink} className="navbar-logo" onClick={handleLinkClick}>
          DeadLines {/* Or your app name */}
        </Link>

        {/* Hamburger Toggle Button */}
        <button
          className={`navbar-toggle ${isMobileMenuOpen ? "open" : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-icon"></span>
        </button>

        {/* Navigation Menu */}
        {/* Add 'open' class conditionally */}
        <ul className={`nav-menu ${isMobileMenuOpen ? "open" : ""}`}>
          {!isAuthenticated ? (
            <>
              {/* Public Links */}
              <li className="nav-item">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive
                      ? "nav-links login-btn active"
                      : "nav-links login-btn"
                  }
                  onClick={handleLinkClick} // Close menu on click
                >
                  Login
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    isActive
                      ? "nav-links register-btn active"
                      : "nav-links register-btn"
                  }
                  onClick={handleLinkClick} // Close menu on click
                >
                  Register
                </NavLink>
              </li>
            </>
          ) : (
            <>
              {/* Authenticated Links */}
              {/* Display Welcome Message (as a non-clickable item) */}
              <li className="nav-item">
                <span className="nav-links welcome-text">
                  Welcome, {user?.name}!
                </span>
              </li>

              {/* Links based on Role */}
              {user?.role === "patient" && (
                <>
                  <li className="nav-item">
                    <NavLink
                      to="/appointments"
                      className={({ isActive }) =>
                        isActive ? "nav-links active" : "nav-links"
                      }
                      onClick={handleLinkClick} // Close menu on click
                    >
                      My Appointments
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/add" // Assuming '/add' is the book appointment route
                      className={({ isActive }) =>
                        isActive
                          ? "nav-links book-btn active"
                          : "nav-links book-btn"
                      }
                      onClick={handleLinkClick} // Close menu on click
                    >
                      Book Appointment
                    </NavLink>
                  </li>
                </>
              )}

              {user?.role === "doctor" && (
                <>
                  <li className="nav-item">
                    <NavLink
                      to="/doctor/dashboard"
                      className={({ isActive }) =>
                        isActive ? "nav-links active" : "nav-links"
                      }
                      onClick={handleLinkClick} // Close menu on click
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  {/* Add other doctor-specific links here if needed */}
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <li className="nav-item">
                    <NavLink
                      to="/admin/dashboard"
                      className={({ isActive }) =>
                        isActive ? "nav-links active" : "nav-links"
                      }
                      onClick={handleLinkClick} // Close menu on click
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/admin/users"
                      className={({ isActive }) =>
                        isActive ? "nav-links active" : "nav-links"
                      }
                      onClick={handleLinkClick} // Close menu on click
                    >
                      User Management
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/admin/doctors"
                      className={({ isActive }) =>
                        isActive ? "nav-links active" : "nav-links"
                      }
                      onClick={handleLinkClick} // Close menu on click
                    >
                      Doctor Management
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/admin/appointments"
                      className={({ isActive }) =>
                        isActive ? "nav-links active" : "nav-links"
                      }
                      onClick={handleLinkClick} // Close menu on click
                    >
                      All Appointments
                    </NavLink>
                  </li>
                </>
              )}

              {/* Common Authenticated Links */}
              <li className="nav-item">
                <NavLink
                  to="/profile/edit" // Assuming '/profile/edit' is the route
                  className={({ isActive }) =>
                    isActive ? "nav-links active" : "nav-links"
                  }
                  onClick={handleLinkClick} // Close menu on click
                >
                  My Profile
                </NavLink>
              </li>

              <li className="nav-item">
                {/* Use an <a> tag or a <button> styled as a link */}
                <a
                  href="#!" // Prevent default link behavior
                  onClick={handleLogout} // Use updated handler
                  className="nav-links logout-btn"
                >
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
