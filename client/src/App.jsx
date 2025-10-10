import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoutes.jsx";

// import Login from "./pages/Login.jsx";
// import Dashboard from "./pages/Dashboard.jsx";
// import QuizPlayer from "./pages/QuizPlayer.jsx";
import LandingPage from "./pages/Home.jsx";
import Layout from "./components/Layout.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import DemoQuiz from "./pages/DemoQuiz.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

export default function App() {
  const { user } = useAuth();
 

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<Login />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/signup" element={<Signup />} />

          <Route path="/verify" element={<VerifyEmail />} />

          <Route path="/demo" element={<DemoQuiz />} />
        </Route>
      </Routes>
    </div>
  );
}
