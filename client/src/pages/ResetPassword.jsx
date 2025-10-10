import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // extract token from URL
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const t = query.get("token");
    if (t) setToken(t);
    else setError("Invalid or missing password reset link.");

    const eml = query.get("email");
    if (eml) setEmail(eml);
    else setError("Invalid or missing password reset link.");
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) return setError("Missing reset token.");
    if (!password || password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");

    setLoading(true);
    try {
        
      const res = await axiosClient.post("/users/reset-password", {
        token,
        newPassword: password,
        email,
      });

      const msg = res?.data?.message || "Password reset successful!";
      setSuccess(msg);

      // Redirect to login after short delay
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Reset failed", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Password reset failed. Please try again.";
      setError(serverMsg);
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
          Reset your password
        </h2>

        {error && (
          <div className="text-red-600 mb-3 text-sm bg-red-50 dark:bg-red-900/40 p-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 mb-3 text-sm bg-green-50 dark:bg-green-900/30 p-2 rounded">
            {success}
          </div>
        )}

        <label className="block mb-4 dark:text-white">
          <div className="text-sm mb-1">New password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <label className="block mb-5 dark:text-white">
          <div className="text-sm mb-1">Confirm new password</div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded transition disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <div className="text-sm text-center mt-4 text-gray-600 dark:text-gray-300">
          Remembered your password?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
}
