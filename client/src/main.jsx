// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { QuizeProvider } from "./contexts/QuizContext.jsx";

import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <QuizeProvider>
          <App />
        </QuizeProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  //{/* </React.StrictMode> */}
);
