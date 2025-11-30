// src/components/QuizResult.jsx
import React from "react";
import PropTypes from "prop-types";

// Helper to safely extract nested properties
const pick = (obj, paths) => {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = obj;
    let ok = true;
    for (const k of parts) {
      if (cur == null || !(k in cur)) {
        ok = false;
        break;
      }
      cur = cur[k];
    }
    if (ok) return cur;
  }
  return undefined;
};

export default function QuizResult({
  mode = "guest-demo",
  quiz = null,
  result = {},
  onRetry = () => window.location.reload(),
  onHome = () => (window.location.href = "/"),
  onViewLeaderboard = null,
}) {
  // 1. Data Extraction
  const data = pick(result, ["data.data", "data", "payload", ""]) ?? result ?? {};
  
  const score = pick(data, ["score", "data.score", "result.score"]) ?? 0;
  const total = pick(data, ["total", "data.total", "result.total", "totalQuestions"]) ?? 0;
  const feedback = pick(data, ["feedback", "data.feedback", "result.feedback", "perQuestionFeedback", "details"]) || [];
  
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  // Determine status color/text
  let statusColor = "text-indigo-600 dark:text-indigo-400";
  let statusBg = "bg-indigo-100 dark:bg-indigo-900/30";
  let statusText = "Good Job!";
  
  if (percentage >= 80) {
    statusColor = "text-green-600 dark:text-green-400";
    statusBg = "bg-green-100 dark:bg-green-900/30";
    statusText = "Outstanding!";
  } else if (percentage < 50) {
    statusColor = "text-amber-600 dark:text-amber-400";
    statusBg = "bg-amber-100 dark:bg-amber-900/30";
    statusText = "Keep Practicing!";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* --- Header / Score Section --- */}
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 text-center border-b border-gray-100 dark:border-gray-700 relative">
          {/* Decorative blurs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white relative z-10">
            Quiz Completed!
          </h2>
          <p className={`mt-2 font-medium ${statusColor} relative z-10`}>
            {statusText}
          </p>

          <div className="mt-8 flex justify-center relative z-10">
            <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border-8 ${percentage >= 80 ? "border-green-500/20" : percentage < 50 ? "border-amber-500/20" : "border-indigo-500/20"}`}>
              <span className={`text-5xl font-bold ${statusColor}`}>
                {score}
              </span>
              <span className="text-gray-400 text-sm font-medium uppercase tracking-wide mt-1">
                of {total}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-2">
             <div className={`px-4 py-1 rounded-full text-sm font-semibold ${statusBg} ${statusColor}`}>
                {percentage}% Score
             </div>
          </div>
        </div>

        {/* --- Feedback Review Section --- */}
        {feedback.length > 0 ? (
          <div className="p-6 sm:p-8 bg-gray-50/50 dark:bg-gray-900/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Detailed Review
            </h3>
            
            <div className="space-y-4">
              {feedback.map((item, idx) => {
                const isCorrect = !!item.isCorrect || item.correct === true;
                return (
                  <div 
                    key={idx} 
                    className={`p-5 rounded-xl border-l-4 shadow-sm bg-white dark:bg-gray-800 ${
                      isCorrect 
                        ? "border-green-500" 
                        : "border-red-500"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-lg mb-3">
                          <span className="text-gray-400 mr-2 text-base">Q{idx + 1}.</span> 
                          {item.question ?? item.questionText ?? "Question Text"}
                        </p>
                        
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                          <div className={`p-3 rounded-lg ${isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                            <span className="block text-xs text-grey-300 dark:text-amber-300 font-semibold uppercase opacity-70 mb-1">Your Answer</span>
                            <span className={isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                              {item.selected ?? item.selectedOption ?? "-"}
                            </span>
                          </div>
                          
                          {!isCorrect && (
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                              <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Correct Answer</span>
                              <span className="text-gray-800 dark:text-gray-200">
                                {item.correct ?? item.correctAnswer ?? "-"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={`shrink-0 p-2 rounded-full ${isCorrect ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"}`}>
                        {isCorrect ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
            <p className="text-gray-500 dark:text-gray-400 italic">
              Detailed feedback is available for registered users.
            </p>
          </div>
        )}

        {/* --- Action Footer --- */}
        <div className="p-6 sm:p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={onHome}
            className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </button>
          
          <button 
            onClick={onRetry}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-transform transform hover:-translate-y-0.5"
          >
            Retry Quiz
          </button>

          {(quiz?._id || quiz?.id) && (
            <button
              onClick={() => onViewLeaderboard ? onViewLeaderboard(quiz._id || quiz.id) : (window.location.href = `/leaderboard/${quiz._id || quiz.id}`)}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/30 transition-transform transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Leaderboard
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

QuizResult.propTypes = {
  mode: PropTypes.oneOf(["guest-demo", "auth-demo"]),
  quiz: PropTypes.object,
  result: PropTypes.object,
  onRetry: PropTypes.func,
  onHome: PropTypes.func,
  onViewLeaderboard: PropTypes.func,
};