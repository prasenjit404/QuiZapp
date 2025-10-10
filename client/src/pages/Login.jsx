import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      navigate("/"); // ✅ redirect after successful login
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-center">
          Sign in to your account
        </h2>

        {error && (
          <div className="text-red-600 mb-3 text-sm bg-red-50 dark:bg-red-900/40 p-2 rounded">
            {error}
          </div>
        )}

        {/* Email field */}
        <label className="block mb-3 dark:text-white">
          <div className="text-sm mb-1">Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        {/* Password field */}
        <label className="block mb-1 dark:text-white">
          <div className="text-sm mb-1">Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        {/* ✅ Forgot Password button */}
        <div className="flex justify-end mb-5">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded transition disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {/* ✅ Link to Signup page */}
        <div className="text-sm text-center mt-4 text-gray-600 dark:text-gray-300">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}
