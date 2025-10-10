// src/components/Layout.jsx
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    // Use the same bg color for the whole page and ensure transitions are smooth
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />

      {/* make main area use same background so there is no different band above footer */}
      <main className="flex-grow bg-white dark:bg-gray-900">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
