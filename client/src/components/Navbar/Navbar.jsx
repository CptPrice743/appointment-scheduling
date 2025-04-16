import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom"; // Use NavLink for active styling if desired
import AuthContext from "../../context/AuthContext.jsx";
import "./Navbar.css";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    // Navigation after logout is likely handled by route protection or context effects
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo links to appropriate dashboard or home */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-logo">
          DeadLines {/* Or your app name */}
        </Link>

        <ul className="nav-menu">
          {!isAuthenticated ? (
            <>
              {/* Public Links */}
              <li className="nav-item">
                {/* Use NavLink for active styling if you add CSS for .active */}
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive
                      ? "nav-links login-btn active"
                      : "nav-links login-btn"
                  }
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
                >
                  Register
                </NavLink>
              </li>
            </>
          ) : (
            <>
              {/* Authenticated Links */}
              {/* Display Welcome Message */}
              <span className="welcome-text">Welcome, {user?.name}!</span>

              {/* Links based on Role */}
              {user?.role === "patient" && (
                <>
                  <li className="nav-item">
                    <NavLink
                      to="/appointments"
                      className={({ isActive }) =>
                        isActive ? "nav-links active" : "nav-links"
                      }
                    >
                      My Appointments
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/add"
                      className={({ isActive }) =>
                        isActive
                          ? "nav-links book-btn active"
                          : "nav-links book-btn"
                      }
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
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  {/* Add other doctor-specific links here if needed */}
                  {/* <li className="nav-item">
                       <NavLink to="/doctor/availability" className={({isActive}) => isActive ? "nav-links active" : "nav-links"}>
                           Availability
                       </NavLink>
                   </li> */}
                </>
              )}

              {/* Common Authenticated Links */}
              <li className="nav-item">
                <NavLink
                  to="/profile/edit"
                  className={({ isActive }) =>
                    isActive ? "nav-links active" : "nav-links"
                  }
                >
                  My Profile
                </NavLink>
              </li>

              <li className="nav-item">
                <a
                  href="#!"
                  onClick={handleLogout}
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
