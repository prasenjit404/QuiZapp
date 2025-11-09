// src/pages/MyQuizzes.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // per-quiz UI state
  const [actionLoading, setActionLoading] = useState({}); // { [quizId]: { deleting, publishing } }
  const [actionMessage, setActionMessage] = useState({}); // { [quizId]: { type, text } }

  // publish modal state
  const [publishModal, setPublishModal] = useState({
    open: false,
    quizId: null,
    startTimeLocal: "", // datetime-local value like "2025-10-14T08:30"
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axiosClient.get("/quizzes/created-all");
        setQuizzes(res?.data?.data ?? []);
      } catch (err) {
        console.error("fetchQuizzes error", err);
        setError(err?.response?.data?.message || "Failed to fetch quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

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

  // Delete quiz
  const handleDelete = async (quizId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this quiz? This action is irreversible."
      )
    )
      return;

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

  // Open publish modal and optionally prefill startTimeLocal from existing ISO startTime
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
    // default to now+5 minutes if nothing to prefill
    if (!pref) {
      const d = new Date(Date.now() + 5 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, "0");
      pref = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    setPublishModal({ open: true, quizId, startTimeLocal: pref });
  };

  // Confirm publish: convert local datetime to ISO UTC and POST to server
  const confirmPublish = async () => {
    const quizId = publishModal.quizId;
    if (!quizId) return;

    // basic validation: startTimeLocal should be a parsable future datetime
    const localVal = publishModal.startTimeLocal;
    if (localVal) {
      const chosen = new Date(localVal);
      if (Number.isNaN(chosen.getTime())) {
        setQuizMessage(quizId, "error", "Invalid start time");
        return;
      }
      if (chosen.getTime() < Date.now() - 5000) {
        if (!window.confirm("Start time is in the past. Publish anyway?"))
          return;
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

  // Cancel publish modal
  const cancelPublish = () =>
    setPublishModal({ open: false, quizId: null, startTimeLocal: "" });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">
          Loading your quizzes…
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
    
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Created Quizzes</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate("/create-quiz")}
              className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
            >
              Create Quiz
            </button>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-white dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-300">
              You haven’t created any quizzes yet.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => {
              const qid = quiz._id;
              const deleting = !!actionLoading[qid]?.deleting;
              const publishing = !!actionLoading[qid]?.publishing;
              const msgObj = actionMessage[qid];

              return (
                <div
                  key={qid}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition"
                >
                  <h2 className="text-xl font-semibold">{quiz.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {quiz.description || "No description provided"}
                  </p>

                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>🧩 Questions: {quiz.questions?.length ?? 0}</p>
                    <p>📋 Total Marks: {quiz.totalMarks ?? "-"}</p>
                    <p>
                      ⏱ Duration:{" "}
                      {typeof quiz.duration === "number"
                        ? `${quiz.duration} ${
                            quiz.duration <= 1 ? "min" : "mins"
                          }`
                        : "Not set"}
                    </p>
                    <p>
                      📢 Published:{" "}
                      <span
                        className={
                          quiz.isPublished ? "text-green-600" : "text-red-500"
                        }
                      >
                        {quiz.isPublished ? "Yes" : "No"}
                      </span>
                    </p>

                    {quiz.isPublished && quiz.startTime && (
                      <p>
                        🕒 Start Time:{" "}
                        {new Date(quiz.startTime).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    )}

                    {quiz._id && (
                      <p>
                        🎟 Quiz Id:{" "}
                        <span className="font-mono">{quiz._id}</span>
                      </p>
                    )}

                    {quiz.accessCode && (
                      <p>
                        🎟 Access Code:{" "}
                        <span className="font-mono">{quiz.accessCode}</span>
                      </p>
                      
                    )}
                  </div>

                  <div className="mt-5 flex justify-end gap-2.5 items-center">
                    {!quiz.isPublished ? (
                      <>
                        {/* Edit Quiz */}
                        <button
                          onClick={() => navigate(`/edit-quiz/${qid}`)}
                          disabled={publishing || deleting}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm disabled:opacity-60"
                        >
                          Edit
                        </button>

                        {/* Publish Quiz */}
                        <button
                          onClick={() => openPublishModal(qid, quiz.startTime)}
                          disabled={publishing || deleting}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm disabled:opacity-60"
                        >
                          {publishing ? "Publishing…" : "Publish"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/quiz/${qid}`)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
                      >
                        View Quiz
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(qid)}
                      disabled={deleting || publishing}
                      className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-sm disabled:opacity-60"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>

                  {msgObj?.text && (
                    <div
                      className={`mt-3 text-sm p-2 rounded ${
                        msgObj.type === "success"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30"
                          : "bg-red-50 text-red-700 dark:bg-red-900/30"
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

      {/* Publish modal */}
      {publishModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Publish quiz</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Choose a start time for this quiz (server expects ISO UTC). If you
              skip, the quiz will start immediately.
            </p>

            <label className="block mb-3 text-sm text-gray-700 dark:text-gray-300">
              Start time (local)
              <input
                type="datetime-local"
                value={publishModal.startTimeLocal}
                onChange={(e) =>
                  setPublishModal((p) => ({
                    ...p,
                    startTimeLocal: e.target.value,
                  }))
                }
                className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-600"
              />
            </label>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={cancelPublish}
                className="px-3 py-2 rounded border bg-white dark:bg-gray-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmPublish}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
