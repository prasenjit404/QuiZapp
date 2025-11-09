// src/pages/CreateQuiz.jsx
import React, { useState } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";

const emptyQuestion = () => ({
  text: "",
  options: ["", "", "", ""],
  correctAnswer: null, // will store option string (like "option3") or index if you prefer
});

export default function CreateQuiz() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(""); // keep as string to match sample
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // helpers
  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx, optIdx, val) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = val;
        // if the correctAnswer was that option (by value), and we changed it, keep track:
        let correct = q.correctAnswer;
        if (correct === `option${optIdx + 1}`) {
          // update to new value string (we store correct as option key later; for now keep key)
          correct = `option${optIdx + 1}`;
        }
        return { ...q, options: opts, correctAnswer: correct };
      })
    );
  };

  const addQuestion = () => setQuestions((p) => [...p, emptyQuestion()]);
  const removeQuestion = (idx) => {
    // if (!window.confirm("Remove this question?")) return;
    setQuestions((p) => p.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q)));
  };

  const removeOption = (qIdx, optIdx) => {
  setQuestions((prev) =>
    prev.map((q, i) => {
      if (i !== qIdx) return q;
      const removedText = q.options[optIdx];
      const opts = q.options.filter((_, j) => j !== optIdx);
      let correct = q.correctAnswer;
      if (correct === removedText) correct = null; // reset if the correct one is deleted
      return { ...q, options: opts, correctAnswer: correct };
    })
  );
};


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
      // correctAnswer can be either stored as "optionN" string OR index; Here we expect option key.
      if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
        setError(`Question ${i + 1}: select the correct option.`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const buildPayload = () => {
    // The sample expects:
    // { title, description, duration: "5", questions: [ { text, options: [...], correctAnswer: "option3" } ] }
    return {
      title: title.trim(),
      description: description.trim(),
      duration: String(duration).trim(),
      questions: questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()),
        // ensure correctAnswer is option string like "option3" (1-based)
        correctAnswer: q.correctAnswer,
      })),
    };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const body = buildPayload();

    try {
      const res = await axiosClient.post("/quizzes/create-quiz", body); // adjust endpoint if needed
      const payload = res?.data ?? res;
      setSuccessMsg(payload?.message ?? "Quiz created successfully");
      // optional: redirect to my-quizzes or the new quiz page. If API returns created quiz id, use it.
      const newQuizId = payload?.data?._id ?? payload?.data?.id ?? null;
      setTimeout(() => {
        navigate("/my-quizzes");
      }, 900);
    } catch (err) {
      console.error("Create quiz error", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create quiz";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create Quiz</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-3 py-2 rounded border bg-white dark:bg-gray-700 dark:hover:bg-gray-900  dark:border-gray-700"
            >
              ← Back
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
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
                          checked={q.correctAnswer === q.options[oi]}
                          onChange={() => updateQuestion(qi, { correctAnswer: q.options[oi] })}
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
            <div className="flex justify-between mb-2 py-2">
              <button type="button" onClick={addQuestion} className="px-3 py-1 text-sm rounded bg-indigo-600 text-white">
                + Add question
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                // quick reset
                if (!window.confirm("Reset the form?")) return;
                setTitle("");
                setDescription("");
                setDuration("");
                setQuestions([emptyQuestion()]);
              }}
              className="px-4 py-2 rounded border bg-white dark:bg-gray-800"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}












