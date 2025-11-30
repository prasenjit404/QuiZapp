// src/pages/MyQuizzes.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [pageLoading, setPageLoading] = useState(true); // Renamed to avoid conflict with auth loading
  const [error, setError] = useState(null);

  // per-quiz UI state
  const [actionLoading, setActionLoading] = useState({});
  const [actionMessage, setActionMessage] = useState({});

  // publish modal state
  const [publishModal, setPublishModal] = useState({
    open: false,
    quizId: null,
    startTimeLocal: "",
  });

  const navigate = useNavigate();
  
  // 1. Get loading state from AuthContext
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // 2. Wait until Auth is done checking/refreshing token
    if (authLoading) return;

    let mounted = true;
    const fetchQuizzes = async () => {
      try {
        const res = await axiosClient.get("/quizzes/created-all");
        if (mounted) setQuizzes(res?.data?.data ?? []);
      } catch (err) {
        console.error("fetchQuizzes error", err);
        if (mounted) setError(err?.response?.data?.message || "Failed to fetch quizzes");
      } finally {
        if (mounted) setPageLoading(false);
      }
    };

    fetchQuizzes();
    return () => { mounted = false; };
  }, [authLoading]); // 3. Re-run once authLoading flips to false

  // helpers to manage per-quiz state
  const setQuizLoading = (quizId, key, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [quizId]: { ...(prev[quizId] || {}), [key]: value },
    }));
  };

  const setQuizMessage = (quizId, type, text) => {
    setActionMessage((prev) => ({ ...prev, [quizId]: { type, text } }));
    if (type === "success") {
      setTimeout(() => {
        setActionMessage((prev) => ({ ...prev, [quizId]: undefined }));
      }, 3000);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz? This cannot be undone.")) return;

    setQuizLoading(quizId, "deleting", true);
    setQuizMessage(quizId, null, null);
    try {
      await axiosClient.delete(`/quizzes/${quizId}`);
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      setQuizMessage(quizId, "success", "Quiz deleted");
    } catch (err) {
      console.error("Delete quiz error", err);
      const msg = err?.response?.data?.message || "Failed to delete quiz";
      setQuizMessage(quizId, "error", msg);
    } finally {
      setQuizLoading(quizId, "deleting", false);
    }
  };

  const openPublishModal = (quizId, existingStartTimeIso) => {
    let pref = "";
    if (existingStartTimeIso) {
      try {
        const dt = new Date(existingStartTimeIso);
        const pad = (n) => String(n).padStart(2, "0");
        const yyyy = dt.getFullYear();
        const mm = pad(dt.getMonth() + 1);
        const dd = pad(dt.getDate());
        const hh = pad(dt.getHours());
        const mi = pad(dt.getMinutes());
        pref = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
      } catch (e) {
        pref = "";
      }
    }
    if (!pref) {
      const d = new Date(Date.now() + 5 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, "0");
      pref = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    setPublishModal({ open: true, quizId, startTimeLocal: pref });
  };

  const confirmPublish = async () => {
    const quizId = publishModal.quizId;
    if (!quizId) return;

    const localVal = publishModal.startTimeLocal;
    if (localVal) {
      const chosen = new Date(localVal);
      if (Number.isNaN(chosen.getTime())) {
        setQuizMessage(quizId, "error", "Invalid start time");
        return;
      }
      if (chosen.getTime() < Date.now() - 5000) {
        if (!window.confirm("Start time is in the past. Publish anyway?")) return;
      }
    }

    setQuizLoading(quizId, "publishing", true);
    setQuizMessage(quizId, null, null);

    try {
      const startIso = publishModal.startTimeLocal
        ? new Date(publishModal.startTimeLocal).toISOString()
        : new Date().toISOString();

      const res = await axiosClient.post(`/quizzes/${quizId}/publish`, {
        startTime: startIso,
      });
      const updated = res?.data?.data ?? res?.data ?? null;

      setQuizzes((prev) =>
        prev.map((q) => {
          if (q._id !== quizId) return q;
          if (updated && (updated._id || updated.id)) {
            return { ...q, ...updated };
          }
          return {
            ...q,
            isPublished: true,
            startTime: startIso,
            accessCode: updated?.accessCode ?? q.accessCode ?? null,
          };
        })
      );

      setQuizMessage(quizId, "success", "Quiz published");
      setPublishModal({ open: false, quizId: null, startTimeLocal: "" });
    } catch (err) {
      console.error("Publish quiz error", err);
      const msg = err?.response?.data?.message || "Failed to publish quiz";
      setQuizMessage(quizId, "error", msg);
    } finally {
      setQuizLoading(quizId, "publishing", false);
    }
  };

  const cancelPublish = () =>
    setPublishModal({ open: false, quizId: null, startTimeLocal: "" });

  const formatDate = (iso) => {
    if (!iso) return "Not scheduled";
    return new Date(iso).toLocaleString("en-IN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  // 4. Show loading state if either Auth is loading OR Page is loading
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading your quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Quizzes</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and publish your assessments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => navigate("/create-quiz")}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-transform transform hover:-translate-y-0.5"
            >
              + Create Quiz
            </button>
          </div>
        </div>

        {/* Empty State */}
        {quizzes.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <div className="text-6xl mb-4 opacity-20">📂</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No quizzes yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Create your first quiz to get started.</p>
            <button
              onClick={() => navigate("/create-quiz")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const qid = quiz._id;
              const isDeleting = actionLoading[qid]?.deleting;
              const isPublishing = actionLoading[qid]?.publishing;
              const msgObj = actionMessage[qid];

              return (
                <div key={qid} className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                  
                  {/* Card Content */}
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        quiz.isPublished 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {quiz.isPublished ? "Published" : "Draft"}
                      </span>
                      {quiz.isPublished && (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-400 uppercase">Code</span>
                          <span className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                            {quiz.accessCode}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1" title={quiz.title}>
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-10">
                      {quiz.description || "No description provided."}
                    </p>

                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {quiz.questions?.length || 0} Qs
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {quiz.duration} min
                      </div>
                      {quiz.isPublished && (
                        <div className="col-span-2 flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Starts: {formatDate(quiz.startTime)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-b-xl border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                    {!quiz.isPublished ? (
                      <>
                        <button
                          onClick={() => navigate(`/edit-quiz/${qid}`)}
                          disabled={isPublishing || isDeleting}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openPublishModal(qid, quiz.startTime)}
                          disabled={isPublishing || isDeleting}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-70"
                        >
                          {isPublishing ? "..." : "Publish"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/quiz/${qid}`)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        Preview
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(qid)}
                      disabled={isDeleting || isPublishing}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete Quiz"
                    >
                      {isDeleting ? (
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      )}
                    </button>
                  </div>

                  {msgObj?.text && (
                    <div
                      className={`mt-3 mx-4 mb-4 text-xs p-2 rounded text-center ${
                        msgObj.type === "success"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {msgObj.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Publish Modal Overlay */}
      {publishModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Publish Quiz</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Set a start time. Students can only enter after this time. If left blank, it starts immediately.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time (Local)
              </label>
              <input
                type="datetime-local"
                value={publishModal.startTimeLocal}
                onChange={(e) => setPublishModal((p) => ({ ...p, startTimeLocal: e.target.value }))}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPublishModal({ open: false, quizId: null, startTimeLocal: "" })}
                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg shadow-green-500/30 transition-transform transform hover:-translate-y-0.5"
              >
                Confirm Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}