// src/pages/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext"; // optional: adjust path if needed
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme?.() ?? { theme: "light" };
  const isDark = theme === "dark";

  // Auth: if you have AuthContext, use it to guard this page
  let auth = null;
  try {
    auth = useAuth();
  } catch (e) {
    auth = null;
  }
  const user = auth?.user ?? null;

  React.useEffect(() => {
    // If this page is strictly for logged-in users, redirect them
    if (auth && !user) {
      navigate("/login");
    }
    // if no auth context is provided we allow the page to render (adjust if you require auth)
  }, [auth, user, navigate]);

  // Demo card state
  const [demoCount, setDemoCount] = React.useState(5);
  const [demoError, setDemoError] = React.useState(null);
  const [demoLoading, setDemoLoading] = React.useState(false);

  // Quiz-by-id card state
  const [quizId, setQuizId] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [quizError, setQuizError] = React.useState(null);

  // Start logged-in demo (passes requestedCount via navigate state)
  const startAuthDemo = async () => {
    setDemoError(null);
    const n = Number(demoCount);
    if (!n || n < 1) {
      setDemoError("Please choose at least 1 question.");
      return;
    }
    setDemoLoading(true);
    try {
      // navigate to demo route and pass requestedCount in state
      navigate("/demo", { state: { requestedCount: n, mode: "auth-demo" } });
    } catch (e) {
      console.error(e);
      setDemoError("Could not start demo. Try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  // Start normal quiz by id (navigate to quiz route, pass otp as query param)
  const startQuizById = (e) => {
    e?.preventDefault();
    setQuizError(null);
    if (!quizId.trim()) {
      setQuizError("Quiz ID is required.");
      return;
    }

    // Navigate to /quiz/:id and pass OTP via location.state (not via URL)
    const path = `/join-quiz/${quizId}`;
    navigate(path, { state: { 
      otp: otp.trim() } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {user
                ? `Welcome back, ${user.fullName ?? user.name ?? user.email}`
                : "Welcome — sign in to access full features."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Demo Quiz Card */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm flex flex-col justify-between items-center text-center min-h-[250px]">
              <div>
                <h2 className="text-xl font-semibold mb-2">Surprise Quiz</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md">
                  Dive into a surprise quiz! Every question comes from a
                  different world — can you ace them all?
                </p>
                <br />
                <p className="text-xs">
                  <span className="text-red-400">Remember:</span> There will be
                  no history of attempted surprise quizes
                </p>
              </div>

              <div className="mt-8 w-full flex flex-col items-center">
                <button
                  onClick={() =>
                    navigate("/demo", { state: { mode: "auth-demo" } })
                  }
                  className="w-1/2 px-5 py-2.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all duration-200"
                >
                  Try Surprise Quiz
                </button>
              </div>
            </div>

            {/* Quiz by ID Card */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Attempt Quiz (by ID)</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Enter the Quiz ID and OTP (if required) to join a scheduled
                quiz.
              </p>

              <form onSubmit={startQuizById} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Quiz ID
                  </label>
                  <input
                    type="text"
                    value={quizId}
                    onChange={(e) => setQuizId(e.target.value)}
                    placeholder="e.g. 68e36b2cc8651b737c8e0ef1"
                    className="w-full mt-1 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    OTP (optional)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP if provided"
                    className="w-full mt-1 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Join Quiz
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuizId("");
                      setOtp("");
                      setQuizError(null);
                    }}
                    className="px-3 py-2 border rounded"
                  >
                    Clear
                  </button>
                </div>

                {quizError && (
                  <div className="text-sm text-red-600">{quizError}</div>
                )}
              </form>
            </div>
          </div>

          {/* Extra area - could add recent quizzes, stats, etc. */}
          <div className="mt-8">
            <h3 className="text-lg font-medium">Quick actions</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/create-quiz")}
                className="px-4 py-2 border rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Create new quiz
              </button>

              <button
                onClick={() => navigate("/my-quizzes")}
                className="px-4 py-2 border rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                My quizzes
              </button>

              <button
                onClick={() => navigate("/history")}
                className="px-4 py-2 border rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                My attempted quizes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
