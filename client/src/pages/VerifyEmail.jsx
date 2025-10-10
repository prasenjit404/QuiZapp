// src/pages/VerifyEmail.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useTheme } from "../contexts/ThemeContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme?.() ?? { theme: "light" };

  // Accept email via navigation state or query param ?email=...
  const qs = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialEmail =
    (location.state && location.state.email) || qs.get("email") || "";

  const [email, setEmail] = React.useState(initialEmail);
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(null);

  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  React.useEffect(() => {
    let t;
    if (resendCooldown > 0) {
      t = setTimeout(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // basic validators
  const validEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const validOtp = (v) => /^\d{4,6}$/.test(v.trim());

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!validOtp(otp)) {
      setError("Please enter the 4-6 digit OTP sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        otp: otp.trim(),
        email: email.trim().toLowerCase(),
      };

      // POST to verification endpoint (change path if your API differs)
      console.log("body: ",body);
      
      const res = await axiosClient.post("/users/verify-email", body);

      console.log("res: ", res);
      

      const payload = res?.data ?? res;
      setSuccess(payload?.message ?? "Email verified successfully.");
      // redirect to login after slight delay
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Verify failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);

    if (!validEmail(email)) {
      setError("Enter a valid email to resend the OTP.");
      return;
    }

    setResendLoading(true);
    try {
      // POST to resend endpoint (change path if your API differs)
      const res = await axiosClient.post("/users/resend-verify", { email: email.trim().toLowerCase() });
      const payload = res?.data ?? res;
      setSuccess(payload?.message ?? "OTP resent. Check your email.");
      // start a short cooldown to avoid abuse (e.g. 30s)
      setResendCooldown(30);
    } catch (err) {
      console.error("Resend OTP failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to resend OTP";
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Enter the OTP sent to your email to verify your account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-6 shadow-sm space-y-4"
        >
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/40 p-2 rounded">{error}</div>}
          {success && <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/30 p-2 rounded">{success}</div>}

          {/* Email input (pre-filled if forwarded) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="appearance-none block w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* OTP input */}
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              One-time password (OTP)
            </label>
            <div className="mt-1">
              <input
                id="otp"
                name="otp"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                placeholder="123456"
                required
                className="appearance-none block w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter the 4–6 digit code from email.</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="py-2 px-3 border rounded bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 disabled:opacity-60"
            >
              {resendLoading ? "Resending…" : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend OTP"}
            </button>
          </div>

          <div className="text-sm text-center text-gray-600 dark:text-gray-300">
            Already verified?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 font-medium"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
