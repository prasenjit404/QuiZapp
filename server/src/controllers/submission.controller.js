import mongoose from "mongoose";
import { Submission } from "../models/submission.model.js";
import { updateLeaderboard } from "./leaderboard.controller.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Quiz } from "../models/quiz.model.js";
import { redis } from "../utils/redis.js";

// 1. Submit Quiz (student)
const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId, answers, startedAt } = req.body;

  const quiz = await Quiz.findById(quizId);
  if (quiz.createdBy.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You can't attempt your own quiz");
  }

  // startedAt will come from frontend when quiz begins
  if (!startedAt) throw new ApiError(400, "Quiz start time is required");

  if (!quizId || !answers || !Array.isArray(answers)) {
    throw new ApiError(400, "QuizId and answers are required");
  }

  const existing = await Submission.findOne({
    quizId,
    submittedBy: req.user._id,
  });
  if (existing) throw new ApiError(400, "You have already submitted this quiz");

  const populatedQuiz = await Quiz.findById(quizId).populate("questions");
  if (!populatedQuiz) throw new ApiError(404, "Quiz not found");

  const questions = populatedQuiz.questions;

  if (!questions.length)
    throw new ApiError(404, "No questions found for this quiz");

  let score = 0;
  const evaluatedAnswers = answers
    .map((ans) => {
      const question = questions.find(
        (q) => q._id.toString() === ans.questionId.toString()
      );
      if (!question) return null;

      const isCorrect = ans.selectedOption === question.correctAnswer;
      // console.log(ans.selectedOption,":", question.correctAnswer);

      const marksAwarded = isCorrect
        ? Number(question.marks || 0)
        : -Number(question.negativeMarks || 0);

      if (!Number.isNaN(marksAwarded)) {
        score += marksAwarded;
      }

      return {
        questionId: ans.questionId,
        question: question.text,
        selectedOption: ans.selectedOption,
        correctOption: question.correctAnswer,
        allOptions: question.options,
        isCorrect,
        marksAwarded,
      };
    })
    .filter(Boolean);

  // score = Math.max(score, 0);

  // Time tracking
  const submittedAt = new Date();
  const startTime = new Date(startedAt);
  const timeTaken = Math.floor(submittedAt - startTime); // miliseconds

  const submission = await Submission.create({
    quizId,
    submittedBy: req.user._id,
    answers: evaluatedAnswers,
    score,
    startedAt: startTime,
    submittedAt,
    timeTaken,
    totalMarks: quiz.totalMarks,
  });

  // Update Leaderboard automatically
  await updateLeaderboard(quizId, req.user._id, score, timeTaken);

  return res
    .status(201)
    .json(new ApiResponse(201, submission, "Quiz submitted successfully"));
});

// 2. Get submission by student for a quiz
const getSubmissionByQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  console.log(req.params);
  
  
  const submission = await Submission.find({
    quizId,
    submittedBy: req.user._id,
  })
    

  if (!submission) throw new ApiError(404, "No submission found");
  console.log(submission);
  
  return res
    .status(200)
    .json(new ApiResponse(200, submission, "Submission fetched successfully"));
});

// 3. Get all attempted quiz of a student
const getUserQuizHistory = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ submittedBy: req.user._id })
    .populate("quizId", "title")
    .select("-answers -timeTaken -startedAt") // fetch quiz details
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, submissions, "Fetched user quiz history"));
});

// 4. Get all submissions of a quiz (for teacher/admin)
const getAllSubmissionsByQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new ApiError(400, "Invalid quiz ID");
  }

  if (req.user.role !== "teacher") {
    throw new ApiError(403, "You are not authorized");
  }

  const submissions = await Submission.find({ quizId })
    .populate("studentId", "name email")
    .populate("quizId", "title totalMarks")
    .sort({ score: -1, createdAt: 1 }); // sort by score desc, then earlier submit first

  return res
    .status(200)
    .json(
      new ApiResponse(200, submissions, "All submissions fetched successfully")
    );
});

const submitDemoQuiz = asyncHandler(async (req, res) => {
  const { sessionId, answers } = req.body;

  if (!sessionId || !answers) {
    throw new ApiError(400, "SessionId and answers are required");
  }

  // fetch original quiz from Redis
  const storedQuiz = await redis.get(`demoQuiz:${sessionId}`);

  if (!storedQuiz) {
    throw new ApiError(404, "Session expired or invalid");
  }

  let parsedQuiz;
  if (typeof storedQuiz === "string") {
    parsedQuiz = JSON.parse(storedQuiz);
  } else {
    parsedQuiz = storedQuiz; // already an object
  }

  // evaluate score
  let score = 0;
  const feedback = [];

  parsedQuiz.forEach((q, idx) => {
    const isCorrect = answers[idx] === q.correct_answer;
    if (isCorrect) score++;

    // Only prepare detailed feedback if logged in
    if (req.user) {
      feedback.push({
        question: q.question,
        selected: answers[idx],
        correct: q.correct_answer,
        isCorrect,
      });
    }
  });

  const responseData = {
    score,
    total: parsedQuiz.length,
  };

  if (req.user) {
    responseData.feedback = feedback;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Demo quiz completed"));
});

export {
  submitQuiz,
  getSubmissionByQuiz,
  getAllSubmissionsByQuiz,
  getUserQuizHistory,
  submitDemoQuiz,
};
