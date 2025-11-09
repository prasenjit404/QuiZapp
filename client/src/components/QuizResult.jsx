// src/components/QuizResult.jsx
import React from "react";
import PropTypes from "prop-types";

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
  // Try multiple common paths to find the meaningful payload
  // console.log(result);
  
  const data = pick(result, [
    "data.data", // e.g. { data: { data: {...} } }
    "data",      // e.g. { data: {...} }
    "payload",   // e.g. { payload: {...} }
    ""           // fallback to the result itself
  ]) ?? result ?? {};

  // Flexible extractors (check several likely locations)
  const score = pick(data, ["score", "data.score", "result.score"]);
  const total = pick(data, ["total", "data.total", "result.total", "totalQuestions"]);

  // feedback can be nested or under different keys — check common places
  const feedback =
    pick(data, ["feedback", "data.feedback", "result.feedback", "perQuestionFeedback", "details"]) ||
    null;

  // small components
  const FeedbackList = ({ items }) => {
    if (!Array.isArray(items) || items.length === 0) {
      return <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">No feedback available.</div>;
    }
    return (
      <div className="mt-6 space-y-3">
        {items.map((fb, idx) => {
          const isCorrect = !!fb.isCorrect || fb.correct === true;
          return (
            <div
              key={fb._id ?? fb.questionId ?? idx}
              className="p-3 rounded border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-900"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">{fb.question ?? fb.questionText ?? `Q ${idx + 1}`}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Your answer: <span className="font-medium">{fb.selected ?? fb.selectedOption ?? "-"}</span>
                  <span className="mx-2">•</span>
                  Correct: <span className="font-medium">{fb.correct ?? fb.correctAnswer ?? "-"}</span>
                </div>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-6">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    isCorrect
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Views (kept same structure as original, but using flexible variables)
  const GuestDemoView = () => (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded">
        <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Demo Quiz Result
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">{result?.message ?? ""}</div>

        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {score ?? "--"}
              {total ? <span className="text-base font-medium text-gray-500 dark:text-gray-400"> / {total}</span> : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={onRetry} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Retry</button>
          <button onClick={onHome} className="px-4 py-2 border rounded bg-white hover:bg-gray-100 dark:bg-gray-200 dark:hover:bg-gray-300">Home</button>
        </div>
      </div>
    </div>
  );

  const AuthDemoView = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Surprise Quiz Result
            </h2>
            {/* <div className="text-sm text-gray-600 dark:text-gray-300">{result?.message ?? ""}</div> */}
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {score ?? "--"}
              {total ? <span className="text-base font-medium text-gray-500 dark:text-gray-400"> / {total}</span> : null}
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div>
          {/* <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Per-question feedback</h3> */}
          <FeedbackList items={Array.isArray(feedback) ? feedback : []} />
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={onRetry} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Retry</button>
          <button onClick={onHome} className="px-4 py-2 border rounded bg-white hover:bg-gray-100 dark:bg-gray-200 dark:hover:bg-gray-300">Home</button>
          {(quiz?._id || quiz?.id) && (
            <button
              onClick={() =>
                onViewLeaderboard ? onViewLeaderboard(quiz._id || quiz.id) : (window.location.href = `/leaderboard/${quiz._id || quiz.id}`)
              }
              className="px-4 py-2 border rounded bg-white dark:bg-gray-900"
            >
              View Leaderboard
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // dev: show raw payload collapsed to inspect structure (only shown if feedback missing)
  const RawPayload = () => (
    <details className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border rounded text-sm">
      <summary className="cursor-pointer">Raw result payload (click to expand)</summary>
      <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
    </details>
  );

  // choose view
  if (mode === "guest-demo") return <GuestDemoView />;
  if (mode === "auth-demo") return (
    <>
      <AuthDemoView />
      {(!Array.isArray(feedback) || feedback.length === 0) && <RawPayload />}
    </>
  );

  // fallback
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Result</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        <div className="mt-4 flex gap-3">
          <button onClick={onRetry} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Retry</button>
          <button onClick={onHome} className="px-4 py-2 border rounded bg-white dark:bg-gray-900">Home</button>
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
