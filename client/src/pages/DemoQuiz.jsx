// src/pages/DemoQuiz.jsx
import React from "react";
import QuizPlayer from "../components/QuizPlayer";
import { useAuth } from "../contexts/AuthContext";



/**
 * DemoQuiz page
 * Uses the shared QuizPlayer component in "guest-demo" mode.
 * QuizPlayer internally fetches the demo quiz, runs the quiz UI,
 * submits the answers and shows QuizResult.
 *
 * If you later want the parent page to handle result display,
 * we can add an onFinish(result) prop to QuizPlayer so the parent
 * can render QuizResult itself. For now keep it simple: delegate.
 */
export default function DemoQuiz() {
  const { user } = useAuth();
  
  return user ? <QuizPlayer mode="auth-demo" /> : <QuizPlayer mode="guest-demo" />;
}
