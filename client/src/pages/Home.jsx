import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* --- Hero Section --- */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
              Master Your Knowledge with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">QuiZapp</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
              The ultimate platform for teachers to assess and students to excel.
              Create engaging quizzes, compete in real-time, and track your progress on the leaderboard.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-3.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
              <Link
                to="/demo"
                className="px-8 py-3.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Try Demo Quiz
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-0 pointer-events-none opacity-50 dark:opacity-20">
          <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-[20%] right-[20%] w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-[40%] w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Why choose QuiZapp?</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Everything you need to run engaging assessments.</p>
          </div>

          {/* Grid: 1 col mobile, 2 cols tablet, 4 cols desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon="⚡"
              title="Real-time Action"
              desc="Instructors start the timer, and students compete instantly. No lag, just pure focus."
            />
            <FeatureCard
              icon="🎲" 
              title="Surprise Quizzes"
              desc="Jump into instant trivia from different worlds. Randomly generated questions for endless fun."
            />
            <FeatureCard
              icon="🏆"
              title="Live Leaderboards"
              desc="Compete for the top spot! See rankings update instantly based on score and speed."
            />
            <FeatureCard
              icon="🔒"
              title="Secure & Private"
              desc="Built with JWT authentication, OTP verification, and role-based access control."
            />
          </div>
        </div>
      </section>

      {/* --- How it Works --- */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
                Simple for Teachers,<br />Fun for Students
              </h2>
              <div className="space-y-8">
                <Step number="1" title="Create" desc="Build custom quizzes with multiple-choice questions in minutes." />
                <Step number="2" title="Share" desc="Publish your quiz and share the unique Access Code or OTP." />
                <Step number="3" title="Analyze" desc="View detailed results and leaderboards to track class performance." />
              </div>
            </div>
            
            {/* Visual Element */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-pink-500 rounded-2xl transform rotate-3 scale-105 opacity-20 blur-lg"></div>
              <div className="relative bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800 text-gray-300">
                <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs font-mono text-gray-500">quizapp.com/live</span>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                    <p className="text-indigo-400 mb-1">Question 1/10</p>
                    <p className="text-white">Which HTTP status code means "Unauthorized"?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-indigo-500 cursor-pointer transition">200 OK</div>
                    <div className="p-3 bg-indigo-900/30 rounded border border-indigo-500 text-white font-medium">401 Unauthorized</div>
                    <div className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-indigo-500 cursor-pointer transition">404 Not Found</div>
                    <div className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-indigo-500 cursor-pointer transition">500 Server Error</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Bottom --- */}
      <section className="py-20 bg-indigo-600 dark:bg-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pattern-dots"></div>
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to transform your quizzes?</h2>
          <p className="text-indigo-100 mb-8 text-lg">Join thousands of students and teachers today.</p>
          <Link
            to="/signup"
            className="inline-block px-10 py-4 rounded-lg bg-white text-indigo-700 font-bold text-lg hover:bg-gray-100 transition shadow-xl hover:-translate-y-1"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}

// Sub-components
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
        {number}
      </div>
      <div>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h4>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}