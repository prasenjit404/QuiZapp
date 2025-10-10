import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const isDark = theme === "dark";

  return (
    <nav className="bg-white dark:bg-gray-700 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to="/" className="font-semibold text-3xl dark:text-white">
              Qui<span className="text-blue-500">Zapp</span>
            </Link>
          </div>

          {/* Right: Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-pressed={isDark}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {isDark ? (
                <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v2m0 14v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-800 dark:text-gray-100" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Login / Logout */}
            {user ? (
              <button
                onClick={logout}
                className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 dark:bg-gray-800 dark:text-red-400"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-300"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(prev => !prev)}
              aria-label="Toggle menu"
              className="p-2 rounded-md inline-flex items-center justify-center text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3 space-y-1 flex flex-col">
            <button
              onClick={() => {
                toggle();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md"
            >
              {isDark ? "Light mode" : "Dark mode"}
            </button>

            {user ? (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-red-600 border border-red-600"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-md text-indigo-600 border border-indigo-600"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
