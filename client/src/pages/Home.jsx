// src/pages/LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme } from "../contexts/ThemeContext";

export default function LandingPage() {
  const { theme, toggle, initialized } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* <Navbar /> */}

      <main className="flex-grow">
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 lg:flex lg:items-center lg:justify-between">
          {/* Left column */}
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Create. Share. Learn.
            </h1>

            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
              QuiZapp makes it simple to build quizzes, invite learners, and get instant results.
              Try the demo without signing up — or log in to manage your quizzes.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <Link
                to="/demo"
                className="inline-flex items-center px-6 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
              >
                Try Demo
              </Link>

              {/* <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Login
              </Link> */}
            </div>
          </div>
        </section>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
