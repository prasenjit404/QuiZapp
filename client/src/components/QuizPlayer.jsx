// src/components/QuizPlayer.jsx
import React from "react";
import axiosClient from "../api/axiosClient";
import QuizResult from "./QuizResult";

// NOTE: We avoid hard 'require' pitfalls by guarding it. Some bundlers don't like runtime require.
// This attempts to read useAuth if available; otherwise user stays null.
const tryGetAuth = () => {
  try {
    // eslint-disable-next-line global-require
    const mod = require("../contexts/AuthContext");
    return mod?.useAuth ?? null;
  } catch (e) {
    return null;
  }
};

export default function QuizPlayer({ mode = "guest-demo", quizId = null }) {
  // optional auth consumption attempt (kept non-breaking)
  let user = null;
  try {
    const useAuth = tryGetAuth();
    if (useAuth) {
      // call hook only inside component render — it's okay here
      const authCtx = useAuth();
      user = authCtx?.user ?? null;
    }
  } catch (e) {
    // swallow: leave user null
    console.warn("AuthContext not available or failed to read it", e);
    user = null;
  }

  const [sessionId, setSessionId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [quiz, setQuiz] = React.useState(null);
  const [error, setError] = React.useState(null);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const questionStartRef = React.useRef(Date.now());
  const startedAtRef = React.useRef(new Date().toISOString());

  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null);

  // auth-demo flow control
  const [requestedCount, setRequestedCount] = React.useState(null); // start null so the input shows
  const [tempCountInput, setTempCountInput] = React.useState(5);

  const effectiveMode = React.useMemo(() => {
    if (quizId) return "quiz";
    if (mode === "auth-demo") return "auth-demo";
    return "guest-demo";
  }, [mode, quizId]);

  // load effect — triggers when effectiveMode changes, quizId changes, OR requestedCount set
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setQuiz(null);

      // For auth-demo we must wait for requestedCount to be set (positive number)
      if (effectiveMode === "auth-demo" && (!requestedCount || requestedCount <= 0)) {
        setLoading(false);
        return;
      }

      try {
        let res;
        if (effectiveMode === "guest-demo") {
          res = await axiosClient.get("/quizzes/demo/start");
        } else if (effectiveMode === "auth-demo") {
          // pass query param name "numberOfQuestions" per your backend
          const q = Number(requestedCount) || undefined;
          const url = q ? `/quizzes/demo/start/protected?numberOfQuestions=${encodeURIComponent(q)}` : "/quizzes/demo/start/protected";
          try {
            res = await axiosClient.get(url);
          } catch (innerErr) {
            // try fallback without param if the server rejects param — keep inner error for logs
            console.warn("Protected demo start failed with param, retrying without param", innerErr);
            res = await axiosClient.get("/quizzes/demo/start/protected");
          }
        } else {
          if (!quizId) throw new Error("quizId is required for mode='quiz'");
          res = await axiosClient.get(`/quizzes/${quizId}`);
        }

        // normalize payload safely
        const payload =
          res?.data?.data?.quiz ??
          res?.data?.quiz ??
          res?.data?.data ??
          res?.data ??
          res;

        const maybeSessionId =
          res?.data?.sessionId ??
          res?.sessionId ??
          res?.data?.data?.sessionId ??
          payload?.sessionId ??
          payload?.session_id ??
          null;

        if (maybeSessionId) setSessionId(maybeSessionId);
        else setSessionId(null);

        if (!mounted) return;

        // Normalization helper
        const normalize = (p) => {
          if (!p) return null;
          if (Array.isArray(p)) {
            return {
              questions: p.map((q, idx) => ({
                _id: q._id ?? q.id ?? `q-${idx}`,
                text: q.question ?? q.text ?? "",
                options: q.options ?? q.choices ?? q.answers ?? [],
                ...q,
              })),
            };
          }
          if (Array.isArray(p.questions)) {
            return {
              ...p,
              questions: p.questions.map((q, idx) => ({
                _id: q._id ?? q.id ?? `q-${idx}`,
                text: q.question ?? q.text ?? "",
                options: q.options ?? q.choices ?? q.answers ?? [],
                ...q,
              })),
            };
          }
          return p;
        };

        const normalized = normalize(payload);
        if (!normalized || !Array.isArray(normalized.questions) || normalized.questions.length === 0) {
          throw new Error("No questions available for this quiz.");
        }

        // slice if server returned more than requestedCount (auth-demo)
        if (effectiveMode === "auth-demo" && requestedCount && normalized.questions.length > requestedCount) {
          normalized.questions = normalized.questions.slice(0, requestedCount);
        }

        setQuiz(normalized);
        setCurrentIndex(0);
        setAnswers({});
        questionStartRef.current = Date.now();
        startedAtRef.current = new Date().toISOString();
      } catch (e) {
        console.error("Quiz load error:", e);
        // prefer server message when present
        const serverMsg = e?.response?.data?.message ?? e?.message ?? "Failed to load quiz.";
        setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [effectiveMode, quizId, requestedCount]);

  const selectOption = (questionId, optionIndex) => {
    const now = Date.now();
    const elapsed = now - (questionStartRef.current || now);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selectedOption: optionIndex,
        timeTaken: (prev[questionId]?.timeTaken || 0) + elapsed,
      },
    }));
    questionStartRef.current = Date.now();
  };

  const goNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, (quiz?.questions?.length || 1) - 1));
    questionStartRef.current = Date.now();
  };
  const goPrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    questionStartRef.current = Date.now();
  };
  const jumpTo = (index) => {
    setCurrentIndex(Math.min(Math.max(0, index), (quiz?.questions?.length || 1) - 1));
    questionStartRef.current = Date.now();
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setError(null);
    // console.log(quiz);
    
    // ensure last question timing recorded
    const lastQ = quiz.questions[currentIndex];
    if (lastQ) {
      const now = Date.now();
      const elapsed = now - (questionStartRef.current || now);
      setAnswers((prev) => ({
        ...prev,
        [lastQ._id || lastQ.id]: {
          selectedOption: prev[lastQ._id || lastQ.id]?.selectedOption,
          timeTaken: (prev[lastQ._id || lastQ.id]?.timeTaken || 0) + elapsed,
        },
      }));
    }

    // micro-wait to flush state updates
    await new Promise((r) => setTimeout(r, 30));

    try {
      let res;
      if (effectiveMode === "guest-demo" || effectiveMode === "auth-demo") {
        if (!sessionId) {
          setError("Submission requires a sessionId from the demo start response.");
          setSubmitting(false);
          return;
        }

        const answersArrayText = (quiz.questions || []).map((q) => {
          const qid = q._id || q.id;
          const pickedIdx = answers[qid]?.selectedOption;
          if (typeof pickedIdx !== "number") return null;
          return q.options?.[pickedIdx] ?? null;
        });

        const body = {
          sessionId,
          answers: answersArrayText,
        };

        // console.log("Submitting demo body:", body);
        if (effectiveMode === "guest-demo")
          res = await axiosClient.post("/submissions/demo/submit", body);
        else
          res = await axiosClient.post("/submissions/demo/submit/protected", body);
        // console.log(res);
        
      } else {
        const answersArray = (quiz.questions || []).map((q) => {
          const qid = q._id || q.id;
          const pickedIdx = answers[qid]?.selectedOption;
          const optionKey = typeof pickedIdx === "number" ? `option${pickedIdx + 1}` : null;
          return {
            questionId: qid,
            selectedOption: optionKey,
          };
        });

        const body = {
          quizId: quiz._id || quiz.id,
          startedAt: startedAtRef.current || new Date().toISOString(),
          answers: answersArray,
        };

        console.log("Submitting quiz body:", body);
        res = await axiosClient.post("/submissions", body);
      }

      const payload = res?.data ?? res;
      setResult(payload);
    } catch (e) {
      console.error("Submit error", e);
      const serverMsg = e?.response?.data ?? e?.message ?? "Submit failed";
      setError(e?.response?.data?.message || (typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg)));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- RENDER PATHS ----------

  // auth-demo: prompt for number of questions before fetching
  if (effectiveMode === "auth-demo" && (!requestedCount || requestedCount <= 0)) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Start demo quiz</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">How many questions would you like to attempt?</p>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="number"
              min={1}
              max={100}
              value={tempCountInput}
              onChange={(e) => {
                const val = Number(e.target.value || 1);
                setTempCountInput(Math.max(1, val));
              }}
              className="w-32 p-2 border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onClick={() => setRequestedCount(Number(tempCountInput))}
            >
              Start demo
            </button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">Tip: pick a small number (5–10) for a quick run.</div>
          {error && <div className="mt-4 text-red-600">{error}</div>}
        </div>
      </div>
    );
  }

  // Loading / error / result UIs
  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center text-gray-700 dark:text-gray-200">Loading quiz…</div>
      </div>
    //   <div
    //   role="status"
    //   aria-live="polite"
    //   className="inline-block animate-spin rounded-full border-2 border-foreground/30 border-t-accent"
    //   style={{ width: 24, height: 24 }}
    // />
    );
  }
  if (error && !quiz) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded"
            onClick={() => {
              // reset and retry from scratch
              setRequestedCount(null);
              setTempCountInput(5);
              setError(null);
              window.location.reload();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <QuizResult
        mode={effectiveMode}
        quiz={quiz}
        result={result}
        onRetry={() => {
          setResult(null);
          setAnswers({});
          setCurrentIndex(0);
          questionStartRef.current = Date.now();
          startedAtRef.current = new Date().toISOString();
        }}
        onHome={() => (window.location.href = "/")}
        onViewLeaderboard={(qid) => (window.location.href = `/leaderboard/${qid}`)}
      />
    );
  }

  // Defensive: ensure quiz and questions exist before rendering the main UI
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center text-gray-700 dark:text-gray-200">No questions to display.</div>
      </div>
    );
  }

  // Main quiz UI
  const q = quiz.questions[currentIndex];
  const qid = q._id || q.id;
  const selected = answers[qid]?.selectedOption;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-3">
        {sessionId ? (
          <div className="text-xs text-gray-600 dark:text-gray-300 break-all">sessionId: {sessionId}</div>
        ) : (
          <div className="text-xs text-yellow-600 dark:text-yellow-300">No sessionId returned by server</div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{quiz.title ?? "Quiz"}</h2>
          {quiz.description && <p className="text-sm text-gray-600 dark:text-gray-400">{quiz.description}</p>}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Question {currentIndex + 1} / {quiz.questions.length}</div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded shadow border border-gray-200 dark:border-gray-800">
        <div className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">{q.text}</div>

        <div className="space-y-3">
          {(q.options || []).map((opt, idx) => {
            const isPicked = selected === idx;
            return (
              <button
                key={idx}
                onClick={() => selectOption(qid, idx)}
                className={`w-full text-left p-3 rounded border focus:outline-none focus:ring-2 ${
                  isPicked
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 ring-indigo-300"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center border text-sm text-gray-800 dark:text-gray-100">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="text-gray-800 dark:text-gray-100">{opt}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="px-3 py-1 rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
            >
              Prev
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex === quiz.questions.length - 1}
              className="px-3 py-1 rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
            >
              Next
            </button>
          </div>

          {currentIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* quick index */}
      <div className="mt-4 flex flex-wrap gap-2">
        {quiz.questions.map((qq, i) => {
          const answered = !!answers[qq._id || qq.id];
          return (
            <button
              key={qq._id || qq.id}
              onClick={() => jumpTo(i)}
              className={`w-10 h-10 rounded flex items-center justify-center border focus:outline-none focus:ring-2 ${
                answered
                  ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                  : "bg-white dark:bg-gray-900/40 border-gray-200 dark:border-gray-700"
              }`}
            >
              <span className="text-gray-800 dark:text-gray-100">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
}
