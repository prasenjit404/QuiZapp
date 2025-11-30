// src/components/QuizPlayer.jsx
import React from "react";
import axiosClient from "../api/axiosClient";
import QuizResult from "./QuizResult";
import Spinner from "./ui/Spinner"; // Assuming you have this or use the inline SVG

// NOTE: We avoid hard 'require' pitfalls by guarding it.
const tryGetAuth = () => {
  try {
    const mod = require("../contexts/AuthContext");
    return mod?.useAuth ?? null;
  } catch (e) {
    return null;
  }
};

export default function QuizPlayer({ mode = "guest-demo", quizId = null }) {
  // Optional auth consumption
  let user = null;
  try {
    const useAuth = tryGetAuth();
    if (useAuth) {
      const authCtx = useAuth();
      user = authCtx?.user ?? null;
    }
  } catch (e) {
    console.warn("AuthContext not available", e);
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

  // Auth-demo flow control
  const [requestedCount, setRequestedCount] = React.useState(null);
  const [tempCountInput, setTempCountInput] = React.useState(5);

  const effectiveMode = React.useMemo(() => {
    if (quizId) return "quiz";
    if (mode === "auth-demo") return "auth-demo";
    return "guest-demo";
  }, [mode, quizId]);

  // Load Effect
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setQuiz(null);

      // Wait for requestedCount if in auth-demo mode
      if (effectiveMode === "auth-demo" && (!requestedCount || requestedCount <= 0)) {
        setLoading(false);
        return;
      }

      try {
        let res;
        if (effectiveMode === "guest-demo") {
          res = await axiosClient.get("/quizzes/demo/start");
        } else if (effectiveMode === "auth-demo") {
          const q = Number(requestedCount) || undefined;
          const url = q
            ? `/quizzes/demo/start/protected?numberOfQuestions=${encodeURIComponent(q)}`
            : "/quizzes/demo/start/protected";
          try {
            res = await axiosClient.get(url);
          } catch (innerErr) {
            console.warn("Protected demo start failed with param, retrying without param", innerErr);
            res = await axiosClient.get("/quizzes/demo/start/protected");
          }
        } else {
          if (!quizId) throw new Error("quizId is required for mode='quiz'");
          res = await axiosClient.get(`/quizzes/${quizId}`);
        }

        const payload = res?.data?.data?.quiz ?? res?.data?.quiz ?? res?.data?.data ?? res?.data ?? res;
        
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

        // Normalization
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
        const serverMsg = e?.response?.data?.message ?? e?.message ?? "Failed to load quiz.";
        setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
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
        const body = { sessionId, answers: answersArrayText };
        res = effectiveMode === "guest-demo"
          ? await axiosClient.post("/submissions/demo/submit", body)
          : await axiosClient.post("/submissions/demo/submit/protected", body);
      } else {
        const answersArray = (quiz.questions || []).map((q) => {
          const qid = q._id || q.id;
          const pickedIdx = answers[qid]?.selectedOption;
          const optionKey = typeof pickedIdx === "number" ? `option${pickedIdx + 1}` : null;
          return { questionId: qid, selectedOption: optionKey };
        });
        const body = {
          quizId: quiz._id || quiz.id,
          startedAt: startedAtRef.current || new Date().toISOString(),
          answers: answersArray,
        };
        res = await axiosClient.post("/submissions", body);
      }
      setResult(res?.data ?? res);
    } catch (e) {
      console.error("Submit error", e);
      const serverMsg = e?.response?.data ?? e?.message ?? "Submit failed";
      setError(e?.response?.data?.message || (typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg)));
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI Components ---

  const Wrapper = ({ children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 relative overflow-hidden transition-colors duration-200">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>
      <div className="relative z-10 w-full max-w-4xl">
        {children}
      </div>
    </div>
  );

  // 1. Auth Demo Setup
  if (effectiveMode === "auth-demo" && (!requestedCount || requestedCount <= 0)) {
    return (
      <Wrapper>
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
          <div className="mb-6 flex justify-center">
            <span className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-4xl">🎲</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Surprise Quiz Setup
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Choose the number of questions for your practice run.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={tempCountInput}
                onChange={(e) => {
                  const val = Number(e.target.value || 1);
                  setTempCountInput(Math.max(1, val));
                }}
                className="w-full p-3 text-center text-lg font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            
            <button
              onClick={() => setRequestedCount(Number(tempCountInput))}
              className="w-full py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 transition-transform transform hover:-translate-y-0.5"
            >
              Start Quiz
            </button>
          </div>
          
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            *Max <span className="font-semibold text-indigo-600 dark:text-indigo-400">50</span> questions allowed.
          </p>
          {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        </div>
      </Wrapper>
    );
  }

  // 2. Loading
  if (loading) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Preparing your quiz...</p>
        </div>
      </Wrapper>
    );
  }

  // 3. Error
  if (error && !quiz) {
    return (
      <Wrapper>
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 mb-4 text-5xl">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </Wrapper>
    );
  }

  // 4. Result
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

  // 5. No Questions
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <Wrapper>
        <div className="text-center text-gray-600 dark:text-gray-300">
          <p>No questions found for this quiz.</p>
          <button onClick={() => window.location.href = "/"} className="mt-4 text-indigo-600 hover:underline">
            Go Home
          </button>
        </div>
      </Wrapper>
    );
  }

  // 6. Main Quiz UI
  const q = quiz.questions[currentIndex];
  const qid = q._id || q.id;
  const selected = answers[qid]?.selectedOption;
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <Wrapper>
      <div className="w-full max-w-3xl mx-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {quiz.title ?? "Quiz Session"}
            </h1>
            {quiz.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{quiz.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
             {/* Progress text or Timer could go here */}
             <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300">
                {currentIndex + 1} / {quiz.questions.length}
             </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-6 relative">
          <h2 className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100 mb-8 leading-snug">
            {q.text}
          </h2>

          <div className="space-y-3">
            {(q.options || []).map((opt, idx) => {
              const isPicked = selected === idx;
              return (
                <button
                  key={idx}
                  onClick={() => selectOption(qid, idx)}
                  className={`group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 outline-none ${
                    isPicked
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600 dark:ring-indigo-500"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                    isPicked
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 group-hover:border-indigo-400"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`text-base ${isPicked ? "text-indigo-900 dark:text-indigo-100 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {currentIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
            >
              Next Question
            </button>
          )}
        </div>

        {/* Quick Jump Grid (Collapsible/Footer) */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((qq, i) => {
              const qIdRef = qq._id || qq.id;
              const isAnswered = answers[qIdRef]?.selectedOption !== undefined;
              const isCurrent = i === currentIndex;
              
              return (
                <button
                  key={qIdRef}
                  onClick={() => jumpTo(i)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200 dark:ring-indigo-900"
                      : isAnswered
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}
      </div>
    </Wrapper>
  );
}