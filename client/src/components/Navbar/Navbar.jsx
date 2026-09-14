import React, { useState, useContext, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import {
  Sun,
  Moon,
  SignOut,
  User,
  CalendarPlus,
  CalendarCheck,
  House,
  UsersThree,
  FirstAid,
  ChartBar,
  ArrowUpRight,
  List,
  X,
} from "@phosphor-icons/react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    logout();
    handleLinkClick();
    navigate("/login");
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const homeLink = isAuthenticated
    ? user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "doctor"
      ? "/doctor/dashboard"
      : "/appointments"
    : "/";

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25";
      case "doctor":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25";
      case "patient":
      default:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
    }
  };

  const navLinkClass = ({ isActive }) =>
    `h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 active:scale-[0.97] ${
      isActive
        ? "text-sky-600 dark:text-sky-400 bg-white dark:bg-[#131720] shadow-xs border border-zinc-200/80 dark:border-white/[0.08]"
        : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/[0.04]"
    }`;

  return (
    <nav className="w-full backdrop-blur-2xl bg-white/85 dark:bg-[#080A0F]/85 border-b border-zinc-200/80 dark:border-white/[0.07] transition-colors duration-300 relative z-30">
      <div className="relative w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-[70px] flex items-center justify-between gap-4">
        
        {/* Left: Brand Mark & Telemetry */}
        <div className="flex items-center gap-4 z-10">
          <Link
            to={homeLink}
            className="flex items-center gap-2.5 group active:scale-[0.98] transition-transform"
            onClick={handleLinkClick}
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/25 transition-transform duration-200 group-hover:scale-105">
              <svg
                width="18"
                height="18"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 6V26M6 16H26"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#080A0F]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tight text-zinc-950 dark:text-white leading-none">
                Dead<span className="text-sky-600 dark:text-sky-400">Lines</span>
              </span>
              <span className="font-mono-code text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                Clinical Precision
              </span>
            </div>
          </Link>

          {/* Real-time System Status Beacon */}
          <div className="hidden lg:inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono-code text-[10px] font-semibold tracking-wider select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Center: Segmented Route Switcher (Dead-Center Aligned) */}
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 items-center gap-1 p-1 rounded-xl bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.05] z-10">
          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Sign In
              </NavLink>
              <NavLink to="/register" className={navLinkClass}>
                Create Account
              </NavLink>
            </>
          ) : (
            <>
              {user?.role === "patient" && (
                <>
                  <NavLink to="/appointments" className={navLinkClass}>
                    <CalendarCheck size={15} weight="regular" />
                    <span>Consultations</span>
                  </NavLink>
                  <NavLink to="/add" className={navLinkClass}>
                    <CalendarPlus size={15} weight="regular" />
                    <span>Book Visit</span>
                  </NavLink>
                </>
              )}

              {user?.role === "doctor" && (
                <NavLink to="/doctor/dashboard" className={navLinkClass}>
                  <House size={15} weight="regular" />
                  <span>Schedule Matrix</span>
                </NavLink>
              )}

              {user?.role === "admin" && (
                <>
                  <NavLink to="/admin/dashboard" className={navLinkClass}>
                    <ChartBar size={15} weight="regular" />
                    <span>Overview</span>
                  </NavLink>
                  <NavLink to="/admin/users" className={navLinkClass}>
                    <UsersThree size={15} weight="regular" />
                    <span>Users</span>
                  </NavLink>
                  <NavLink to="/admin/doctors" className={navLinkClass}>
                    <FirstAid size={15} weight="regular" />
                    <span>Doctors</span>
                  </NavLink>
                  <NavLink to="/admin/appointments" className={navLinkClass}>
                    <CalendarCheck size={15} weight="regular" />
                    <span>Oversight</span>
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        {/* Right Utilities & Authentication Controls */}
        <div className="flex items-center gap-2.5 z-10">
          {/* Quick Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] btn-press cursor-pointer"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <div className="t-icon-swap" data-state={theme === "dark" ? "b" : "a"}>
              <span className="t-icon" data-icon="a">
                <Moon size={17} weight="bold" className="text-zinc-600 dark:text-zinc-300" />
              </span>
              <span className="t-icon" data-icon="b">
                <Sun size={17} weight="bold" className="text-amber-400" />
              </span>
            </div>
          </button>

          {/* Desktop Authentication Controls (lg+) */}
          {isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-2">
              {/* Role Pill */}
              <div
                className={`h-9 px-3 inline-flex items-center justify-center rounded-xl border font-mono-code text-[10px] font-bold uppercase tracking-wider select-none ${getRoleBadgeStyle(
                  user?.role
                )}`}
              >
                {user?.role || "User"}
              </div>

              {/* Profile Pill */}
              <NavLink
                to="/profile/edit"
                className="h-9 px-3 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 text-xs font-semibold tracking-tight btn-press cursor-pointer"
                title="Account Settings"
                onClick={handleLinkClick}
              >
                <div className="w-5.5 h-5.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={12} />}
                </div>
                <span className="max-w-[120px] truncate">{user?.name}</span>
              </NavLink>

              {/* Sign Out Action */}
              <button
                onClick={handleLogout}
                className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold tracking-tight btn-press cursor-pointer"
                title="Sign Out"
                aria-label="Logout"
              >
                <SignOut size={15} weight="bold" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <NavLink to="/login" className={navLinkClass}>
                Sign In
              </NavLink>
            </div>
          )}

          {/* Mobile & Tablet Hamburger Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="h-9 w-9 inline-flex lg:hidden items-center justify-center rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.03] text-zinc-950 dark:text-white btn-press cursor-pointer"
            aria-label="Toggle Menu"
          >
            <div className="t-icon-swap" data-state={isMobileMenuOpen ? "b" : "a"}>
              <span className="t-icon" data-icon="a">
                <List size={20} weight="bold" />
              </span>
              <span className="t-icon" data-icon="b">
                <X size={20} weight="bold" />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-100%)] z-40 bg-white/95 dark:bg-[#080A0F]/95 backdrop-blur-2xl p-5 sm:p-6 flex flex-col gap-5 overflow-y-auto border-t border-zinc-200/80 dark:border-white/[0.08] shadow-2xl animate-materialize">
          {isAuthenticated && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                    {user?.name}
                  </div>
                  <div className="font-mono-code text-[11px] text-zinc-400 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`font-mono-code text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border font-bold ${getRoleBadgeStyle(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="h-9 px-3 rounded-xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.96] transition-all cursor-pointer"
                  title="Sign Out"
                  aria-label="Logout"
                >
                  <SignOut size={15} weight="bold" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-1.5">
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/login"
                  className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3"
                  onClick={handleLinkClick}
                >
                  <User size={18} />
                  <span>Sign In</span>
                </NavLink>
                <NavLink
                  to="/register"
                  className="h-11 px-4 rounded-xl bg-sky-600 text-white font-semibold text-sm flex items-center justify-between mt-2"
                  onClick={handleLinkClick}
                >
                  <span>Create Account</span>
                  <ArrowUpRight size={16} weight="bold" />
                </NavLink>
              </>
            ) : (
              <>
                {user?.role === "patient" && (
                  <>
                    <NavLink
                      to="/appointments"
                      className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3"
                      onClick={handleLinkClick}
                    >
                      <CalendarCheck size={18} />
                      <span>Consultations</span>
                    </NavLink>
                    <NavLink
                      to="/add"
                      className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3"
                      onClick={handleLinkClick}
                    >
                      <CalendarPlus size={18} />
                      <span>Book Visit</span>
                    </NavLink>
                  </>
                )}

                {user?.role === "doctor" && (
                  <NavLink
                    to="/doctor/dashboard"
                    className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3"
                    onClick={handleLinkClick}
                  >
                    <House size={18} />
                    <span>Schedule Matrix</span>
                  </NavLink>
                )}

                {user?.role === "admin" && (
                  <>
                    <NavLink
                      to="/admin/dashboard"
                      className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3"
                      onClick={handleLinkClick}
                    >
                      <ChartBar size={18} />
                      <span>Overview</span>
                    </NavLink>
                    <NavLink
                      to="/admin/users"
                      className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3"
                      onClick={handleLinkClick}
                    >
                      <UsersThree size={18} />
                      <span>User Directory</span>
                    </NavLink>
                    <NavLink
                      to="/admin/doctors"
                      className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3"
                      onClick={handleLinkClick}
                    >
                      <FirstAid size={18} />
                      <span>Physicians</span>
                    </NavLink>
                    <NavLink
                      to="/admin/appointments"
                      className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3"
                      onClick={handleLinkClick}
                    >
                      <CalendarCheck size={18} />
                      <span>Oversight Registry</span>
                    </NavLink>
                  </>
                )}

                <NavLink
                  to="/profile/edit"
                  className="h-11 px-4 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-sm flex items-center gap-3 mt-3 pt-3 border-t border-zinc-200/80 dark:border-white/[0.08]"
                  onClick={handleLinkClick}
                >
                  <User size={18} />
                  <span>Account Settings</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
