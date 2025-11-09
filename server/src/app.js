import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      "http://localhost:5173"
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//will use if we take files from user in future
// app.use(express.static())

app.use(cookieParser());

// routers import
import userRouter from "./routes/user.routes.js";
import quizRouter from "./routes/quiz.routes.js";
// import questionRouter from "./routes/question.routes.js";
import submissionRouter from "./routes/submission.routes.js";
import leaderboardRouter from "./routes/leaderboard.routes.js";

// routers declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/quizzes", quizRouter);
// app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/leaderboards", leaderboardRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// global error handler
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error("Unexpected Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

export { app };
