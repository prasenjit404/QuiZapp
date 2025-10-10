// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-800 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          © {new Date().getFullYear()} QuiZapp. All rights reserved.
        </div>

        <div className="flex items-center gap-4 text-sm">
          <a
            href="#"
            className="text-gray-500 dark:text-gray-400 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 rounded"
            aria-label="Privacy policy"
          >
            Privacy
          </a>
          <a
            href="#"
            className="text-gray-500 dark:text-gray-400 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 rounded"
            aria-label="Terms of service"
          >
            Terms
          </a>
          <a
            href="#"
            className="text-gray-500 dark:text-gray-400 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 rounded"
            aria-label="Contact"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
