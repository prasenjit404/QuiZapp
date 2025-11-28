import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Safe access to auth context
  let auth = null;
  try {
    auth = useAuth();
  } catch (e) {
    auth = null;
  }
  const user = auth?.user ?? null;

  // Protect the route
  useEffect(() => {
    if (auth && !user && !auth.loading) {
      navigate("/login");
    }
  }, [auth, user, navigate]);

  // Quiz Join State
  const [quizId, setQuizId] = useState("");
  const [otp, setOtp] = useState("");
  const [quizError, setQuizError] = useState(null);

  // Handlers
  const handleJoinQuiz = (e) => {
    e.preventDefault();
    setQuizError(null);
    
    if (!quizId.trim()) {
      setQuizError("Please enter a valid Quiz ID.");
      return;
    }

    // Navigate to /join-quiz/:id and pass OTP via state (preserving original logic)
    navigate(`/join-quiz/${quizId.trim()}`, { 
      state: { otp: otp.trim() } 
    });
  };

  const startAuthDemo = () => {
    // Passing mode: "auth-demo" triggers the logic in QuizPlayer to asking for question count
    navigate("/demo", { state: { mode: "auth-demo" } });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* --- Header Section --- */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Welcome back, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.fullName || user?.email || "Scholar"}</span>! 
          </p>
        </header>

        {/* --- Main Action Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Card 1: Join Quiz (Primary Action) */}
          <div className="relative group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <svg className="w-24 h-24 text-indigo-600 dark:text-indigo-400 transform rotate-12 group-hover:rotate-6 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-2 relative z-10">Join a Live Quiz</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 relative z-10">
              Enter the Quiz ID and OTP provided by your instructor to start.
            </p>

            <form onSubmit={handleJoinQuiz} className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz ID</label>
                  <input
                    type="text"
                    value={quizId}
                    onChange={(e) => setQuizId(e.target.value)}
                    placeholder="e.g. 68e3..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Code"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>
              
              {quizError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/50">
                  {quizError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-0.5"
              >
                Enter Quiz Room
              </button>
            </form>
          </div>

          {/* Card 2: Surprise Quiz */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 shadow-lg text-white flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-0 opacity-10 transform scale-150 translate-x-10 -translate-y-10 pointer-events-none">
              <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            </div>

            <div className="relative z-10">
              <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-indigo-100 uppercase bg-white/20 rounded-full backdrop-blur-sm">
                Practice Mode
              </div>
              <h2 className="text-3xl font-bold mb-4">Surprise Quiz</h2>
              <p className="text-indigo-100 mb-8 max-w-md text-lg leading-relaxed">
                Dive into a surprise quiz! Every question comes from a different world — can you ace them all?
                <br/><span className="text-sm opacity-70 mt-2 block">(No history saved)</span>
              </p>
            </div>

            <button
              onClick={startAuthDemo}
              className="relative z-10 w-full sm:w-auto py-3.5 px-8 rounded-lg bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors shadow-xl"
            >
              Start Practice Session
            </button>
          </div>
        </div>

        {/* --- Management Tools Section --- */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <DashboardActionCard
              title="Create New Quiz"
              desc="Design a custom quiz for your students."
              icon="+"
              onClick={() => navigate("/create-quiz")}
              color="blue"
            />
            <DashboardActionCard
              title="My Quizzes"
              desc="Manage, edit and publish your quizzes."
              icon="📂"
              onClick={() => navigate("/my-quizzes")}
              color="emerald"
            />
            <DashboardActionCard
              title="Attempt History"
              desc="View your past scores and performance."
              icon="📜"
              onClick={() => navigate("/history")}
              color="amber"
            />
          </div>
        </section>

      </div>
    </div>
  );
}

// Sub-component for uniform action cards
function DashboardActionCard({ title, desc, icon, onClick, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white",
  };

  return (
    <button 
      onClick={onClick}
      className="group flex items-start p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-lg transition-all duration-200 text-left"
    >
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-colors duration-200 ${colors[color]}`}>
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
          {desc}
        </p>
      </div>
    </button>
  );
}