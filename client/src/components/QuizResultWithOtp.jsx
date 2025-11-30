import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function QuizResultWithOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams();

  // Result passed from QuizPlayerWithOtp navigate()
  const result = location.state?.result || {};
  const payload = result?.data?.data?.data || result?.data?.data || result?.data || result;

  const {
    score = 0,
    totalMarks = 0,
    startedAt,
    submittedAt,
    timeTaken,
    answers = [],
  } = payload || {};

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  const fmtDateTime = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const fmtDuration = (ms) => {
    if (!ms) return "-";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-10 px-4 transition-colors duration-200">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* --- Score Card --- */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <h1 className="text-3xl font-bold relative z-10">Quiz Results</h1>
            <p className="opacity-90 relative z-10">Here is how you performed</p>

            <div className="mt-8 flex justify-center relative z-10">
              <div className="w-40 h-40 bg-white/10 backdrop-blur-md rounded-full flex flex-col items-center justify-center border-4 border-white/20 shadow-inner">
                <span className="text-5xl font-extrabold">{score}</span>
                <span className="text-sm font-medium uppercase tracking-wide opacity-80">/ {totalMarks}</span>
              </div>
            </div>
            
            <div className="mt-4 inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur text-sm font-semibold relative z-10">
              {percentage}% Accuracy
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            <div className="p-6 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Started</p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{fmtDateTime(startedAt)}</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Submitted</p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{fmtDateTime(submittedAt)}</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{fmtDuration(timeTaken)}</p>
            </div>
          </div>
        </div>

        {/* --- Detailed Analysis --- */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white px-2">Detailed Analysis</h2>

          {answers.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No answer data available.</p>
            </div>
          ) : (
            answers.map((a, idx) => {
              const options = a.allOptions || [];
              const correctAns = a.correctOption;
              const userAns = a.selectedOption;
              const isCorrect = a.isCorrect;

              return (
                <div
                  key={a._id || idx}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-l-4 p-6 ${
                    isCorrect ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      <span className="text-gray-400 mr-2 text-base">Q{idx + 1}.</span> 
                      {a.question || "Untitled Question"}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                      isCorrect 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}>
                      {a.marksAwarded > 0 ? `+${a.marksAwarded}` : a.marksAwarded} Marks
                    </span>
                  </div>

                  <div className="space-y-2 pl-4 border-l-2 border-gray-100 dark:border-gray-700 ml-1">
                    {options.map((opt, oi) => {
                      const isOptCorrect = opt === correctAns;
                      const isUserSelected = opt === userAns;
                      
                      let rowClass = "border-transparent bg-transparent text-gray-600 dark:text-gray-400";
                      let icon = null;

                      if (isOptCorrect) {
                        rowClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 font-medium";
                        icon = <span className="text-green-600">✓</span>;
                      } else if (isUserSelected && !isOptCorrect) {
                        rowClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 font-medium";
                        icon = <span className="text-red-600">✕</span>;
                      }

                      return (
                        <div key={oi} className={`flex items-center justify-between p-3 rounded-lg border ${rowClass}`}>
                          <span>{opt}</span>
                          <span className="text-lg">{icon}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- Action Buttons --- */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/history")}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-transform transform hover:-translate-y-0.5"
          >
            View Attempt History
          </button>
        </div>
      </div>
    </div>
  );
}