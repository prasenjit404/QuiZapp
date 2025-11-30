import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoutes.jsx";
import Layout from "./components/Layout.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";

// Pages
import LandingPage from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DemoQuiz from "./pages/DemoQuiz.jsx";

// Protected Pages
import MyQuizzes from "./pages/MyQuizzes.jsx";
import AttemptedQuizzes from "./pages/AttemptedQuizzes.jsx";
import CreateQuiz from "./pages/CreateQuiz.jsx";
import EditQuiz from "./pages/EditQuiz.jsx";
import JoinQuiz from "./pages/JoinQuiz.jsx"; // Assuming this is the quiz player wrapper
import QuizPlayerWithOtp from "./components/QuizPlayerWithOTP.jsx";
import QuizResultWithOtp from "./components/QuizResultWithOtp.jsx";

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route path="/" element={user ? <Dashboard /> : <LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Guest/Demo Route (can be accessed by anyone or restricted if needed) */}
          <Route path="/demo" element={<DemoQuiz />} />

          {/* 🔒 Protected Routes (Require Login) */}
          <Route
            path="/my-quizzes"
            element={
              <ProtectedRoute>
                <MyQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AttemptedQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-quiz"
            element={
              <ProtectedRoute>
                <CreateQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-quiz/:id"
            element={
              <ProtectedRoute>
                <EditQuiz />
              </ProtectedRoute>
            }
          />
          
          {/* Note: If JoinQuiz is for students who might be guests, keep it public. 
              If only logged-in users can join, wrap it. 
              Based on your app logic, students usually need to log in to track history. */}
          <Route
            path="/join-quiz/:quizId"
            element={
              <ProtectedRoute>
                <QuizPlayerWithOtp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:quizId/result"
            element={
              <ProtectedRoute>
                <QuizResultWithOtp />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </div>
  );
}