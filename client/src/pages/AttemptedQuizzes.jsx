import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * AttemptedQuizzes.jsx
 * Fetches and displays a user's quiz submissions (attempt history).
 *
 * Tries endpoints in order:
 *  - GET /submissions/history
 *  - GET /submissions/my
 *  - GET /submissions
 *
 * Adjust endpoints if your API differs.
 */

function formatISTDate(isoOrDate) {
  if (!isoOrDate) return "-";
  try {
    return new Date(isoOrDate).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return isoOrDate;
  }
}

function formatDuration(ms) {
  if (typeof ms !== "number") return "-";
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}m ${ss}s`;
}

export default function AttemptedQuizzes() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth?.() ?? {}; // safe if no auth context

  useEffect(() => {
    let mounted = true;
    const endpoint = "/submissions/history";
    const fetchOne = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(endpoint);
        // prefer array in res.data.data or res.data
        const payload = res?.data?.data ?? res?.data ?? res;
        // make sure it's an array
        if (!mounted) return;
        if (Array.isArray(payload)) {
          setSubmissions(payload);
          setLoading(false);
          return;
        }
        // If backend wraps differently (like { statusCode, data: [...] })
        if (payload && Array.isArray(payload.data)) {
          setSubmissions(payload.data);
          setLoading(false);
          return;
        }
        // If the response had data that is an array inside res.data, try res.data.data
        if (Array.isArray(res?.data)) {
          setSubmissions(res.data);
          setLoading(false);
          return;
        }
        // not an array — try next endpoint
      } catch (err) {
        // If 404 or 401, continue trying other endpoints; otherwise record error but keep trying
        console.warn(
          `Attempt ${endpoint} failed:`,
          err?.response?.status,
          err?.message
        );
        // keep trying other endpoints
      }
      if (mounted) {
        setError("Failed to fetch attempted quizzes.");
        setLoading(false);
      }
    };

    fetchOne();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-center">
          <div className="mb-2 text-gray-700 dark:text-gray-300">
            Loading your attempts…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Attempts</h1>
          <div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ← Back
            </button>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-white dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-300">
              You haven't attempted any quizzes yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => {
              // console.log(s);
              
              // submission shape variations handled safely
              const sid = s._id ?? s.id ?? s._doc?._id;
              const quiz = s.quizId ?? s.quiz ?? s._doc?.quizId;
              const quizTitle =
                (quiz && (quiz.title || quiz.name)) ?? "Untitled Quiz";
              const score = s.score ?? s._doc?.score ?? s.data?.score ?? null;
              const total =
                s.totalMarks ??
                s.total ??
                s._doc?.totalMarks ??
                s.data?.total ??
                null;
              const submittedAt =
                s.submittedAt ??
                s.createdAt ??
                s._doc?.createdAt ??
                s._doc?.submittedAt;
              const timeTaken = s.timeTaken ?? s._doc?.timeTaken ?? null;

              return (
                <div
                  key={sid}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-lg font-semibold">{quizTitle}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Submitted: {formatISTDate(submittedAt)}
                          {timeTaken ? " • " + formatDuration(timeTaken) : ""}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 flex flex-wrap gap-4">
                      <div>
                        <span className="font-medium">Score:</span>{" "}
                        <span className="text-indigo-600 dark:text-indigo-300">
                          {score ?? "-"}
                        </span>
                        {total ? (
                          <span className="text-gray-500 dark:text-gray-400">
                            {" "}
                            / {total}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-end gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await axiosClient.get(
                            `/submissions/${s.quizId._id}/student`
                          );
                          const data = res?.data?.data ?? res?.data;

                          console.log("✅ Submission successful:",data[0]);

                          navigate(`/quiz/${s.quizId._id}/result`, {
                            state: { result: data[0] },
                          });
                        } catch (err) {
                          console.error("❌ Failed to fetch submission:", err);
                          alert("Could not load result. Please try again.");
                        }
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                    >
                      View Result
                    </button>

                    <button
                      onClick={() => navigate(`/leaderboard/${sid}`)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-700 text-white rounded text-sm"
                    >
                      Leaderboard
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
