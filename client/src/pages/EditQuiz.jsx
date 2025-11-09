// src/pages/EditQuiz.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";

/**
 * EditQuiz.jsx
 * - GET /quizzes/:id to load quiz
 * - PUT /quizzes/:id to update quiz
 *
 * Assumptions:
 * - Server returns quiz with fields similar to Create payload:
 *   { title, description, duration, questions: [{ text, options: [...], correctAnswer: "option2" }, ...] }
 * - Adjust endpoints if your API differs.
 */

const emptyQuestion = () => ({
  text: "",
  options: ["", "", "", ""],
  correctAnswer: null,
});

export default function EditQuiz() {
  const { id } = useParams(); // quiz id
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(`/quizzes/${encodeURIComponent(id)}`);
        const payload = res?.data?.data ?? res?.data ?? res;

        // payload might be quiz object or wrapped; try to locate quiz object
        const quiz = payload && payload.title ? payload : payload?.quiz ?? payload?.data ?? payload;

        if (!mounted) return;

        // Normalize into our form shape
        setTitle(quiz.title ?? "");
        setDescription(quiz.description ?? "");
        setDuration(String(quiz.duration ?? ""));

        const normalizedQuestions = (quiz.questions ?? []).map((q, idx) => {
          // server may return questions as array of IDs (if not populated) — guard against that
          if (typeof q === "string") {
            // no question details — create empty stub
            return {
              text: "",
              options: ["", "", "", ""],
              correctAnswer: null,
            };
          }

          // q may have fields: text / question / options / choices / correctAnswer / correct
          const options = q.options ?? q.choices ?? q.answers ?? [];
          // normalize correctAnswer: server might send index or "optionN" or value; preserve if looks like optionN
          let correct = q.correctAnswer ?? q.correct ?? null;
          if (typeof correct === "number") {
            correct = `option${correct + 1}`;
          }

          // if correct is a value (e.g., "option text") and not "optionN", try to map to option index
          if (correct && !/^option\d+$/.test(correct)) {
            const matchIdx = options.findIndex((o) => o === correct);
            if (matchIdx >= 0) correct = `option${matchIdx + 1}`;
            else correct = null;
          }

          // ensure at least 4 options (pad if needed)
          // const optsFixed = [...options];
          // while (optsFixed.length < 4) optsFixed.push("");

          return {
            text: q.text ?? q.question ?? "",
            options,
            correctAnswer: correct,
          };
        });

        setQuestions(normalizedQuestions.length ? normalizedQuestions : [emptyQuestion()]);
      } catch (err) {
        console.error("Failed to load quiz", err);
        setError(err?.response?.data?.message || "Failed to load quiz");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // helpers to update form
  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx, optIdx, val) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = val;
        // if correctAnswer referenced this option key (optionN), keep it as is (value changes outside)
        return { ...q, options: opts };
      })
    );
  };

  const addQuestion = () => setQuestions((p) => [...p, emptyQuestion()]);
  const removeQuestion = (idx) => {
    if (!window.confirm("Remove this question?")) return;
    setQuestions((p) => p.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q)));
  };

  const removeOption = (qIdx, optIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = q.options.filter((_, j) => j !== optIdx);
        let correct = q.correctAnswer;
        if (correct === `option${optIdx + 1}`) correct = null;
        return { ...q, options: opts, correctAnswer: correct };
      })
    );
  };

  // validation (similar to CreateQuiz)
  const validate = () => {
    if (!title.trim()) {
      setError("Please enter a title for the quiz.");
      return false;
    }
    if (!duration || Number.isNaN(Number(duration)) || Number(duration) <= 0) {
      setError("Please enter a valid duration in minutes.");
      return false;
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      setError("Add at least one question.");
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.text.trim()) {
        setError(`Question ${i + 1}: text is required.`);
        return false;
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        setError(`Question ${i + 1}: add at least two options.`);
        return false;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          setError(`Question ${i + 1}: option ${j + 1} is empty.`);
          return false;
        }
      }
      if (!q.correctAnswer) {
        setError(`Question ${i + 1}: select the correct option.`);
        return false;
      }
      if (!/^option\d+$/.test(q.correctAnswer)) {
        setError(`Question ${i + 1}: correct option format invalid.`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim(),
    duration: String(duration).trim(),
    questions: questions.map((q) => ({
      text: q.text.trim(),
      options: q.options.map((o) => o.trim()),
      correctAnswer: q.correctAnswer,
    })),
  });

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const body = buildPayload();

    try {
      const res = await axiosClient.patch(`/quizzes/${encodeURIComponent(id)}`, body);
      const payload = res?.data ?? res;
      setSuccessMsg(payload?.message ?? "Quiz updated successfully");
      // short delay then navigate to my-quizzes or view page
      const newId = payload?.data?._id ?? id;
      setTimeout(() => {
        navigate(`/my-quizzes`);
      }, 900);
    } catch (err) {
      console.error("Save quiz error", err);
      setError(err?.response?.data?.message || err?.message || "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-gray-700 dark:text-gray-300">Loading quiz…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Quiz</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/my-quizzes")}
              className="px-3 py-2 rounded border bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              ← Back
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
          {error && <div className="text-red-600 p-2 rounded bg-red-50 dark:bg-red-900/30">{error}</div>}
          {successMsg && <div className="text-green-700 p-2 rounded bg-green-50 dark:bg-green-900/30">{successMsg}</div>}

          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-600"
              placeholder="Quiz title"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-600"
              placeholder="Short description (optional)"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Duration (minutes)</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-40 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-600"
              placeholder="e.g. 5"
              type="number"
              min={1}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Questions</h2>
              <button type="button" onClick={addQuestion} className="px-3 py-1 text-sm rounded bg-indigo-600 text-white">
                + Add question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, qi) => (
                <div key={qi} className="p-4 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Question {qi + 1}</label>
                      <input
                        value={q.text}
                        onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                        placeholder="Enter question text"
                        required
                      />
                    </div>

                    <div className="ml-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => removeQuestion(qi)}
                        className="px-2 py-1 text-sm rounded bg-red-600 text-white"
                        disabled={questions.length === 1}
                        title="Remove question"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="text-sm mb-1">Options</div>

                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctAnswer === `option${oi + 1}`}
                          onChange={() => updateQuestion(qi, { correctAnswer: `option${oi + 1}` })}
                          className="w-4 h-4"
                        />
                        <input
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          className="flex-1 p-2 border rounded bg-white dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                          placeholder={`Option ${oi + 1}`}
                          required
                        />

                        <button
                          type="button"
                          onClick={() => removeOption(qi, oi)}
                          className="px-2 py-1 text-sm rounded bg-red-500 text-white"
                          disabled={q.options.length <= 2}
                          title="Remove option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => addOption(qi)} className="px-2 py-1 rounded border">
                        + Option
                      </button>

                      <div className="text-xs text-gray-500 dark:text-gray-400 self-center">
                        Select the correct option with the radio button.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Reset edits to original loaded values?")) return;
                // reload the page to re-fetch original quiz
                window.location.reload();
              }}
              className="px-4 py-2 rounded border bg-white dark:bg-gray-800"
            >
              Reset
            </button>

            <button type="submit" disabled={saving} className="px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
