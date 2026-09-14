import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";
import { LockKey, EnvelopeSimple, ArrowUpRight, SpinnerGap } from "@phosphor-icons/react";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;
  const { login, isAuthenticated, error, clearError, isLoading, user } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-[calc(100dvh-7rem)] flex items-center justify-center px-4 py-12 relative">
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/[0.06] dark:bg-sky-500/[0.04] rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md doppelrand-shell animate-materialize">
        <div className="doppelrand-core p-8 sm:p-9">
          <div className="specular-hairline" />

          {/* Brand & Clinic Title */}
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 items-center justify-center text-white mb-4 shadow-sm shadow-sky-500/20">
              <svg
                width="22"
                height="22"
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
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Sign In to DeadLines
            </h2>
            <p className="font-body text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Access your clinical scheduling and consultation records
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium font-mono-code flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <EnvelopeSimple size={18} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-code mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <LockKey size={18} />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.03] text-zinc-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative inline-flex items-center justify-center gap-3 py-2.5 px-5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              >
                {isLoading ? (
                  <>
                    <SpinnerGap size={18} className="animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <span className="w-7 h-7 rounded-full bg-white/15 dark:bg-zinc-950/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight size={14} weight="bold" />
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-white/[0.06] text-center text-xs text-zinc-500 dark:text-zinc-400">
            Need an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Create patient or doctor account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
