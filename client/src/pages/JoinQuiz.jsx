import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const tryGetAuth = () => {
  try {
    // eslint-disable-next-line global-require
    const mod = require("../contexts/AuthContext");
    return mod?.useAuth ?? null;
  } catch (e) {
    return null;
  }
};

// --- LocalStorage Helpers ---
const LS_KEY = (quizId) => `quiz-progress-${quizId}`;

function saveProgress(quizId, data) {
  if (!quizId || !data) return;
  try {
    localStorage.setItem(LS_KEY(quizId), JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to save progress:", err);
  }
}

function loadProgress(quizId) {
  if (!quizId) return null;
  try {
    const raw = localStorage.getItem(LS_KEY(quizId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Failed to load progress:", err);
    return null;
  }
}

function clearProgress(quizId) {
  try {
    localStorage.removeItem(LS_KEY(quizId));
  } catch {}
}

export default function QuizPlayer({ mode = "guest-demo", quizId = null }) {
  // --- Optional Auth Support ---
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

  // --- States ---
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

  // Demo-related state
  const [requestedCount, setRequestedCount] = React.useState(null);
  const [tempCountInput, setTempCountInput] = React.useState(5);

  const effectiveMode = React.useMemo(() => {
    if (quizId) return "quiz";
    if (mode === "auth-demo") return "auth-demo";
    return "guest-demo";
  }, [mode, quizId]);

  // --- Load quiz or restore saved progress ---
  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setQuiz(null);

      // ✅ Try restore from localStorage
      const saved = loadProgress(quizId);
      if (saved && saved.quiz && Array.isArray(saved.quiz.questions)) {
        console.log("♻️ Restoring quiz progress from localStorage");
        setQuiz(saved.quiz);
        setAnswers(saved.answers || {});
        setCurrentIndex(saved.currentIndex || 0);
        setSessionId(saved.sessionId || null);
        startedAtRef.current = saved.startedAt || new Date().toISOString();
        setLoading(false);
        return;
      }

      // For auth-demo: wait for count
      if (
        effectiveMode === "auth-demo" &&
        (!requestedCount || requestedCount <= 0)
      ) {
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
          } catch {
            res = await axiosClient.get("/quizzes/demo/start/protected");
          }
        } else {
          if (!quizId) throw new Error("quizId is required for mode='quiz'");
          res = await axiosClient.get(`/quizzes/${quizId}`);
        }

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

        if (!mounted) return;

        const normalize = (p) => {
          if (!p) return null;
          if (Array.isArray(p)) {
            return { questions: p.map((q, i) => ({ ...q, _id: q._id || `q-${i}` })) };
          }
          if (Array.isArray(p.questions)) {
            return {
              ...p,
              questions: p.questions.map((q, i) => ({ ...q, _id: q._id || `q-${i}` })),
            };
          }
          return p;
        };

        const normalized = normalize(payload);
        if (!normalized?.questions?.length)
          throw new Error("No questions available.");

        if (
          effectiveMode === "auth-demo" &&
          requestedCount &&
          normalized.questions.length > requestedCount
        ) {
          normalized.questions = normalized.questions.slice(0, requestedCount);
        }

        setQuiz(normalized);
        setCurrentIndex(0);
        setAnswers({});
        questionStartRef.current = Date.now();
        startedAtRef.current = new Date().toISOString();

        // ✅ Save initial state
        saveProgress(quizId, {
          quiz: normalized,
          answers: {},
          currentIndex: 0,
          sessionId: maybeSessionId,
          startedAt: startedAtRef.current,
        });
      } catch (e) {
        console.error("Quiz load error:", e);
        const msg = e?.response?.data?.message || e?.message || "Failed to load quiz.";
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [effectiveMode, quizId, requestedCount]);

  // --- Selecting and navigation ---
  const persistState = (nextIndex, nextAnswers = answers) => {
    saveProgress(quizId, {
      quiz,
      answers: nextAnswers,
      currentIndex: nextIndex,
      sessionId,
      startedAt: startedAtRef.current,
    });
  };

  const selectOption = (questionId, optionIndex) => {
    const now = Date.now();
    const elapsed = now - (questionStartRef.current || now);
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: {
          selectedOption: optionIndex,
          timeTaken: (prev[questionId]?.timeTaken || 0) + elapsed,
        },
      };
      persistState(currentIndex, newAnswers);
      return newAnswers;
    });
    questionStartRef.current = Date.now();
  };

  const goNext = () => {
    const newIndex = Math.min(currentIndex + 1, (quiz?.questions?.length || 1) - 1);
    setCurrentIndex(newIndex);
    persistState(newIndex);
    questionStartRef.current = Date.now();
  };

  const goPrev = () => {
    const newIndex = Math.max(currentIndex - 1, 0);
    setCurrentIndex(newIndex);
    persistState(newIndex);
    questionStartRef.current = Date.now();
  };

  const jumpTo = (index) => {
    const newIndex = Math.min(Math.max(0, index), (quiz?.questions?.length || 1) - 1);
    setCurrentIndex(newIndex);
    persistState(newIndex);
    questionStartRef.current = Date.now();
  };

  // --- Submit ---
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
        if (!sessionId) throw new Error("Missing sessionId");
        const answersArrayText = quiz.questions.map((q) => {
          const qid = q._id;
          const pickedIdx = answers[qid]?.selectedOption;
          if (typeof pickedIdx !== "number") return null;
          return q.options[pickedIdx];
        });
        const body = { sessionId, answers: answersArrayText };
        res =
          effectiveMode === "guest-demo"
            ? await axiosClient.post("/submissions/demo/submit", body)
            : await axiosClient.post("/submissions/demo/submit/protected", body);
      } else {
        const answersArray = quiz.questions.map((q) => {
          const qid = q._id;
          const pickedIdx = answers[qid]?.selectedOption;
          return {
            questionId: qid,
            selectedOption:
              typeof pickedIdx === "number" ? `option${pickedIdx + 1}` : null,
          };
        });
        const body = {
          quizId: quiz._id,
          startedAt: startedAtRef.current,
          answers: answersArray,
        };
        res = await axiosClient.post("/submissions", body);
      }

      const payload = res?.data ?? res;
      clearProgress(quiz._id);
      setResult(payload);
    } catch (e) {
      console.error("Submit error", e);
      setError(e?.response?.data?.message || e.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Rendering ---
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-700 dark:text-gray-200">
        Loading quiz…
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="p-6 text-center text-red-600">
        Error: {error}
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded"
            onClick={() => window.location.reload()}
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
          clearProgress(quiz._id);
          window.location.reload();
        }}
        onHome={() => (window.location.href = "/")}
      />
    );
  }

  if (!quiz?.questions?.length) {
    return <div className="p-6 text-center">No questions to display.</div>;
  }

  const q = quiz.questions[currentIndex];
  const qid = q._id;
  const selected = answers[qid]?.selectedOption;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{quiz.title || "Quiz"}</h2>
        <span className="text-sm text-gray-500">
          Q{currentIndex + 1}/{quiz.questions.length}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded shadow border">
        <div className="mb-4 text-lg font-medium">{q.text}</div>

        {(q.options || []).map((opt, idx) => {
          const isPicked = selected === idx;
          return (
            <button
              key={idx}
              onClick={() => selectOption(qid, idx)}
              className={`w-full text-left p-3 rounded border mb-2 ${
                isPicked
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              }`}
            >
              {opt}
            </button>
          );
        })}

        <div className="mt-6 flex justify-between">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          {currentIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>

        <button
          onClick={() => {
            if (window.confirm("Clear saved progress?")) {
              clearProgress(quizId);
              window.location.reload();
            }
          }}
          className="mt-3 text-xs text-gray-500 underline"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}
