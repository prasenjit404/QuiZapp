// src/pages/Signup.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useTheme } from "../contexts/ThemeContext"; // optional: for styling variations

export default function Signup() {
  const navigate = useNavigate();
  const { theme } = useTheme?.() ?? { theme: "light" }; // safe fallback

  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [errors, setErrors] = React.useState({});
  const [serverError, setServerError] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState(null);

  // validators
  const validators = {
    fullName: (v) => (v && v.trim().length >= 2 ? null : "Please enter your full name (min 2 chars)."),
    email: (v) => (v && /^\S+@\S+\.\S+$/.test(v) ? null : "Please enter a valid email address."),
    // password: (v) => (v && v.length >= 6 ? null : "Password must be at least 6 characters."),
    // confirmPassword: (v, all) => (v === all.password ? null : "Passwords do not match."),
    role: (v) => (v === "student" || v === "teacher" ? null : "Please select a valid role."),
  };

  const validateAll = () => {
    const next = {};
    Object.keys(validators).forEach((key) => {
      const err = validators[key](form[key], form);
      if (err) next[key] = err;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setSubmitting(true);
    setServerError(null);

    try {
      // Build body exactly as your backend expects
      const body = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      };

      // POST to your register endpoint (change if your API differs)
      const res = await axiosClient.post("/users/register", body);

      const payload = res?.data ?? res;
      setSuccessMessage(payload?.message ?? "Signup successful. Please verify your email.");
      // short delay so user sees message then redirect to login
      setTimeout(() => {
        navigate("/verify", { state: { email: body.email } });
      }, 1500);
    } catch (err) {
      console.error("Signup failed", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Signup failed";
      setServerError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Start creating quizzes — it's free and fast.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-lg p-6"
        >
          {serverError && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/40 p-2 rounded">
              {serverError}
            </div>
          )}

          {successMessage && (
            <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/30 p-2 rounded">
              {successMessage}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            {/* Full Name */}
            <div className="mb-3">
              <label htmlFor="fullName" className="sr-only">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={form.fullName}
                onChange={handleChange}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.fullName ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Full name"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" className="mt-1 text-xs text-red-600">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Email address"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.password ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Password (min 6 chars)"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Confirm password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Role select */}
            <div className="mb-5">
              <label htmlFor="role" className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Role</label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${errors.role ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500`}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {submitting ? "Signing up…" : "Create account"}
            </button>
          </div>

          <div className="text-sm text-center text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 font-medium"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
