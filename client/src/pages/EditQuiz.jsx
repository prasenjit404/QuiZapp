import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";

// Helper for new empty questions
const emptyQuestion = () => ({
  text: "",
  options: ["", "", "", ""],
  correctAnswer: null,
});

export default function EditQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);

  // Load Quiz Data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get(`/quizzes/${encodeURIComponent(id)}`);
        const payload = res?.data?.data ?? res?.data ?? res;
        const quiz = payload && payload.title ? payload : payload?.quiz ?? payload?.data ?? payload;

        if (!mounted) return;

        setTitle(quiz.title ?? "");
        setDescription(quiz.description ?? "");
        setDuration(String(quiz.duration ?? ""));

        const normalizedQuestions = (quiz.questions ?? []).map((q) => {
          if (typeof q === "string") return emptyQuestion(); // Handle ID-only edge case

          const options = q.options ?? q.choices ?? q.answers ?? [];
          let correct = q.correctAnswer ?? q.correct ?? null;
          
          // Normalize correct answer format
          if (typeof correct === "number") correct = `option${correct + 1}`;
          else if (correct && !/^option\d+$/.test(correct)) {
             // If stored as value, map back to key if possible (optional logic)
             // For this form we stick to value-based matching if that's what the backend uses, 
             // or key-based. Your CreateQuiz used value matching. 
             // Let's assume we store the text value as per CreateQuiz logic:
          }

          return {
            _id: q._id, // Keep ID for updates
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
    return () => { mounted = false; };
  }, [id]);

  // --- Logic Handlers ---

  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handleUpdateOption = (qIdx, optIdx, val) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const oldVal = q.options[optIdx];
        const newOptions = [...q.options];
        newOptions[optIdx] = val;

        // Auto-update correct answer if text changes
        let newCorrect = q.correctAnswer;
        if (newCorrect === oldVal) newCorrect = val;

        return { ...q, options: newOptions, correctAnswer: newCorrect };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeQuestion = (idx) => {
    if (!window.confirm("Remove this question?")) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q))
    );
  };

  const removeOption = (qIdx, optIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const removedVal = q.options[optIdx];
        const newOpts = q.options.filter((_, j) => j !== optIdx);
        let newCorrect = q.correctAnswer;
        if (newCorrect === removedVal) newCorrect = null;
        return { ...q, options: newOpts, correctAnswer: newCorrect };
      })
    );
  };

  const validate = () => {
    if (!title.trim()) return "Please enter a quiz title.";
    if (!duration || isNaN(duration) || Number(duration) <= 0) return "Please enter a valid duration.";
    if (questions.length === 0) return "Add at least one question.";

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} is empty.`;
      if (q.options.length < 2) return `Question ${i + 1} needs at least 2 options.`;
      if (q.options.some((o) => !o.trim())) return `Question ${i + 1} has empty options.`;
      if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) return `Select the correct answer for Question ${i + 1}.`;
    }
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const body = {
      title: title.trim(),
      description: description.trim(),
      duration: Number(duration),
      questions: questions.map((q) => ({
        _id: q._id, // Pass ID to update existing
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()),
        correctAnswer: q.correctAnswer,
      })),
    };

    try {
      await axiosClient.patch(`/quizzes/${encodeURIComponent(id)}`, body);
      setSuccessMsg("Quiz updated successfully");
      setTimeout(() => {
        navigate(`/my-quizzes`);
      }, 1000);
    } catch (err) {
      console.error("Save quiz error", err);
      setError(err?.response?.data?.message || "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
        Loading quiz data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-24 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Edit Quiz</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Update your existing assessment</p>
          </div>
          <button
            onClick={() => navigate("/my-quizzes")}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel & Back
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-full shadow-lg">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Quiz Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-t-4 border-t-amber-500 border-x border-b border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <div className="space-y-5">
              <div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-3xl font-bold bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-amber-500 outline-none pb-2 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white transition-colors"
                  placeholder="Quiz Title"
                  required
                />
              </div>
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all resize-none"
                  placeholder="Quiz Description"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Duration:</span>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-24 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-center text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="mins"
                  type="number"
                  min="1"
                  required
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">minutes</span>
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {questions.map((q, qi) => (
              <div key={qi} className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-all hover:shadow-md">
                
                <div className="flex items-start gap-4 mb-6">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-sm">
                    {qi + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      value={q.text}
                      onChange={(e) => updateQuestion(qi, "text", e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      placeholder="Question Text"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove Question"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <div className="space-y-3 pl-12">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Options</p>
                  
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctAnswer === opt && opt !== ""}
                          onChange={() => updateQuestion(qi, "correctAnswer", opt)}
                          className="w-5 h-5 text-amber-600 border-gray-300 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                          disabled={!opt}
                        />
                      </div>
                      
                      <div className="flex-1 relative">
                        <input
                          value={opt}
                          onChange={(e) => handleUpdateOption(qi, oi, e.target.value)}
                          className={`w-full p-3 rounded-lg border outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 ${
                            q.correctAnswer === opt && opt !== ""
                              ? "bg-green-50 dark:bg-green-900/10 border-green-500 dark:border-green-600 text-gray-900 dark:text-white"
                              : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-amber-500"
                          }`}
                          placeholder={`Option ${oi + 1}`}
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                        disabled={q.options.length <= 2}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addOption(qi)}
                    className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add Option
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-20">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-6 py-2.5 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                >
                  + Question
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Reset all changes to original?")) window.location.reload();
                  }}
                  className="px-4 py-2.5 rounded-lg text-gray-500 hover:text-gray-200 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Reset
                </button>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg shadow-amber-500/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}