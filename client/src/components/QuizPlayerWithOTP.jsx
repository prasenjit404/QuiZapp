import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function QuizPlayerWithOtp() {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const otpFromState = location.state?.otp || "";
  const [otp] = useState(otpFromState);

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [available, setAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch quiz by ID + OTP (via query params)
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/quizzes/${quizId}`, otp ? { params: { accessCode: otp } } : {});
        const data = res?.data?.data || res.data;

        if (data.startsInSeconds) {
          setCountdown(data.startsInSeconds);
          setAvailable(false);
          setQuiz(data);
        } else {
          setQuiz(data);
          setAvailable(true);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, otp]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setAvailable(true);
      setCountdown(null);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Option selection
  const handleOptionSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  // Navigation
  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  // Submit quiz
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Convert answers to array format
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));

      const payload = {
        quizId,
        answers: formattedAnswers,
        startedAt: startedAt || new Date().toISOString(),
      };

      const res = await axiosClient.post("/submissions/submit", payload);
      const data = res?.data?.data || res.data;

      console.log("✅ Submission successful:",data);
      navigate(`/quiz/${quizId}/result`, { state: { result: data } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Start quiz
  const startQuiz = () => {
    setQuizStarted(true);
    setStartedAt(new Date().toISOString());
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-200">
        Loading quiz…
      </div>
    );

  // Error state
  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
        <p className="text-lg font-semibold mb-2">⚠️ {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-800 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );

  // Countdown waiting screen
  if (!available && countdown !== null)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <h1 className="text-2xl font-semibold mb-2">{quiz?.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{quiz?.description}</p>
        <p className="text-lg font-medium text-yellow-500 mb-2">Quiz starts in:</p>
        <p className="text-4xl font-mono font-bold mb-4">{formatTime(countdown)}</p>
        <button
          disabled
          className="w-64 py-2.5 rounded-md bg-gray-400 text-white cursor-not-allowed"
        >
          Waiting to start…
        </button>
      </div>
    );

  // Start quiz screen
  if (!quizStarted)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 w-full max-w-lg text-center border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-2">{quiz?.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{quiz?.description}</p>
          <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <p>
              <strong>Duration:</strong> {quiz?.duration ?? 0} min
            </p>
            <p>
              <strong>Total Marks:</strong> {quiz?.totalMarks ?? 0}
            </p>
            <p>
              <strong>Questions:</strong> {quiz?.questions?.length ?? 0}
            </p>
          </div>
          <button
            onClick={startQuiz}
            className="w-full py-2.5 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-all"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );

  // Main quiz screen
  const question = quiz.questions[currentIndex];

  return (
    <div className="flex flex-col items-center min-h-screen py-10 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold">{quiz.title}</h1>
          <span className="text-sm text-gray-500">
            Q{currentIndex + 1}/{quiz.questions.length}
          </span>
        </div>

        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
          {question.text}
        </h2>

        <div className="flex flex-col gap-3">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(question._id, opt)}
              className={`px-4 py-2 text-left border rounded-md transition ${
                answers[question._id] === opt
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>

          {currentIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
