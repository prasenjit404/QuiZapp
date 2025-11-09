// src/pages/QuizResultWithOtp.jsx
import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function QuizResultWithOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams();

  // Result passed from QuizPlayerWithOtp navigate()
  const result = location.state?.result || {};

  // Safely extract data
  const payload = result?.data?.data?.data || result?.data?.data || result?.data || result;

  const {
    score = 0,
    totalMarks = 0,
    startedAt,
    submittedAt,
    timeTaken,
    answers = [],
  } = payload || {};

  const fmtDateTime = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return dt.toLocaleString();
  };

  const fmtDuration = (ms) => {
    if (!ms) return "-";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quiz Results
          </h1>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
            <div className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
              {score}{" "}
              <span className="text-gray-500 text-base">/ {totalMarks}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded border text-center dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Started</div>
            <div className="text-sm text-gray-800 dark:text-gray-200">
              {fmtDateTime(startedAt)}
            </div>
          </div>
          <div className="p-3 rounded border text-center dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Submitted</div>
            <div className="text-sm text-gray-800 dark:text-gray-200">
              {fmtDateTime(submittedAt)}
            </div>
          </div>
          <div className="p-3 rounded border text-center dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Time Taken</div>
            <div className="text-sm text-gray-800 dark:text-gray-200">
              {fmtDuration(timeTaken)}
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Answers
        </h2>

        {/* Question List */}
        {answers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No answers data available.
          </p>
        ) : (
          <div className="space-y-4">
            {answers.map((a, idx) => {
              const q = a.questionId || {}; // populated question
              const options = a.allOptions || [];
              const correctAns = a.correctOption;
              const userAns = a.selectedOption;

              return (
                <div
                  key={a._id || idx}
                  className="p-4 rounded border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                    <strong>Q{idx + 1}:</strong> {a.question || "Untitled Question"}
                  </p>

                  <div className="space-y-2">
                    {options.map((opt, oi) => {
                      const isCorrect = opt === correctAns;
                      const isUserSelected = opt === userAns;
                      const isWrongChoice = isUserSelected && !isCorrect;

                      return (
                        <div
                          key={oi}
                          className={`p-2 rounded border text-sm
                            ${
                              isCorrect
                                ? "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : isWrongChoice
                                ? "bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            }
                          `}
                        >
                          {opt}
                          {isCorrect && (
                            <span className="ml-2 text-xs font-medium text-green-700 dark:text-green-300">
                              (Correct)
                            </span>
                          )}
                          {isWrongChoice && (
                            <span className="ml-2 text-xs font-medium text-red-700 dark:text-red-300">
                              (Your answer)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        a.isCorrect
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {a.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Marks: {a.marksAwarded ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-blue-500 dark:bg-blue-700 hover:bg-blue-600 dark:hover:bg-blue-800 text-white dark:text-gray-100 rounded-md"
          >
            Home
          </button>

          <button
            onClick={() => navigate("/history")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-700 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-900 text-white dark:text-gray-100 rounded-md"
          >
            My Attempted Quizzes
          </button>
        </div>
      </div>
    </div>
  );
}
