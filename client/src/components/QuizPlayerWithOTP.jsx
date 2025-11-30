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

  // Fetch quiz by ID + OTP
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

  const handleOptionSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
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

      navigate(`/quiz/${quizId}/result`, { state: { result: data } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setStartedAt(new Date().toISOString());
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // --- UI Wrapper ---
  const Wrapper = ({ children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>
      <div className="relative z-10 w-full max-w-3xl">
        {children}
      </div>
    </div>
  );

  // 1. Loading
  if (loading) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading quiz session...</p>
        </div>
      </Wrapper>
    );
  }

  // 2. Error
  if (error) {
    return (
      <Wrapper>
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center border border-gray-100 dark:border-gray-700">
          <div className="text-red-500 mb-4 text-5xl">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load Quiz</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </Wrapper>
    );
  }

  // 3. Countdown (Waiting Room)
  if (!available && countdown !== null) {
    return (
      <Wrapper>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center border border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{quiz?.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{quiz?.description || "Get ready, the quiz will begin shortly."}</p>
          
          <div className="mb-8">
            <span className="text-sm font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Starting In</span>
            <div className="text-6xl font-mono font-bold text-gray-900 dark:text-white mt-2">
              {formatTime(countdown)}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 animate-pulse">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Waiting for server start time...
          </div>
        </div>
      </Wrapper>
    );
  }

  // 4. Start Screen (Before entering questions)
  if (!quizStarted) {
    return (
      <Wrapper>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">{quiz?.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">{quiz?.description}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Duration</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{quiz?.duration ?? 0}m</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Questions</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{quiz?.questions?.length ?? 0}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Marks</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{quiz?.totalMarks ?? 0}</p>
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 transition-transform transform hover:-translate-y-0.5"
          >
            Start Quiz Now
          </button>
        </div>
      </Wrapper>
    );
  }

  // 5. Main Quiz Interface
  const question = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <Wrapper>
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{quiz.title}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Question {currentIndex + 1} of {quiz.questions.length}</span>
          </div>
          {/* Optional: Add a live timer here if needed */}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-6">
          <h3 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-6 leading-snug">
            {question.text}
          </h3>

          <div className="space-y-3">
            {question.options.map((opt, idx) => {
              const isSelected = answers[question._id] === opt;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(question._id, opt)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 outline-none ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600 dark:ring-indigo-500"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`text-base ${isSelected ? "text-indigo-900 dark:text-indigo-100 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
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
              onClick={handleNext}
              className="px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </Wrapper>
  );
}