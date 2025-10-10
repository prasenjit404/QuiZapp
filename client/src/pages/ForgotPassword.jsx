import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // ✅ Replace with your actual API endpoint
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset email");

      setMessage("Password reset link has been sent to your email.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-center">
          Forgot Password
        </h2>

        {message && (
          <div className="text-green-600 mb-3 text-sm bg-green-50 dark:bg-green-900/30 p-2 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="text-red-600 mb-3 text-sm bg-red-50 dark:bg-red-900/40 p-2 rounded">
            {error}
          </div>
        )}

        <label className="block mb-4 dark:text-white">
          <div className="text-sm mb-1">Enter your registered email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded transition disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>

        <div className="text-sm text-center mt-4 text-gray-600 dark:text-gray-300">
          Remembered your password?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
          >
            Go back to Login
          </button>
        </div>
      </form>
    </div>
  );
}
