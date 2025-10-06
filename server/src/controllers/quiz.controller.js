import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Quiz } from "../models/quiz.model.js";
import { createQuestionService } from "../services/question.service.js";
import { Question } from "../models/question.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { io } from "../index.js";
import { redis } from "../utils/redis.js";
import { v4 as uuidv4 } from "uuid";
import he from "he";

/**
 * @desc Create a new quiz
 * @route POST /api/v1/quizzes/createQuiz
 * @access Private (Admin/Teacher)
 */
const createQuiz = asyncHandler(async (req, res) => {
  const { title, description, duration, totalMarks, questions } = req.body;

  if (!title || !description || !duration || !questions?.length) {
    throw new ApiError(400, "All fields are required");
  }

  const quiz = await Quiz.create({
    title,
    description,
    duration,
    questions: [],
    totalMarks: 0,
    createdBy: req.user._id,
  });

  await Promise.all(
    questions.map((q) => createQuestionService({ quizId: quiz._id, ...q }))
  );

  const updatedQuiz = await Quiz.findById(quiz._id);

  const totalMarksAgg = await Question.aggregate([
    { $match: { quizId: quiz._id } },
    { $group: { _id: null, total: { $sum: "$marks" } } },
  ]);

  updatedQuiz.totalMarks = totalMarksAgg[0]?.total || 0;

  await updatedQuiz.save();

  return res
    .status(201)
    .json(new ApiResponse(201, updatedQuiz, "Quiz created successfully"));
});

/**
 * @desc Publish a new quiz
 * @route POST /api/v1/quizzes/publish
 * @access Private (Admin/Teacher)
 */
// Utility: schedule quiz start
const scheduleQuizStart = (quizId, startTime) => {
  const delay = startTime.getTime() - Date.now();
  if (delay > 0) {
    setTimeout(() => {
      io.to(`quiz:${quizId}`).emit("quizStarted", { quizId });
      console.log(`Quiz ${quizId} started!`);
    }, delay);
  } else {
    console.warn(
      `Start time for quiz ${quizId} is in the past. Skipping scheduling.`
    );
  }
};

const publishQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { startTime } = req.body; // teacher provides start time (ISO string or timestamp)

  if (req.user.role !== "teacher") {
    throw new ApiError(403, "You are not authorized!");
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");

  if (!quiz.createdBy.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized!");
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Parse start time
  const quizStartTime = new Date(startTime);
  if (isNaN(quizStartTime.getTime())) {
    throw new ApiError(400, "Invalid start time");
  }

  // Expiry = startTime + duration (in minutes)
  const expiry = new Date(quizStartTime.getTime() + quiz.duration * 60 * 1000);

  quiz.isProtected = true;
  quiz.accessCode = otp;
  quiz.startTime = quizStartTime;
  quiz.accessCodeExpiry = expiry;

  await quiz.save();

  // Schedule socket event for quiz start
  scheduleQuizStart(quiz._id.toString(), quizStartTime);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessCode: otp, startTime: quizStartTime, expiresAt: expiry },
        "Quiz published with OTP and start time"
      )
    );
});

/**
 * @desc Get a demo quiz for both registered and non registered user
 * @route GET /api/v1/quizzes/demo/start or /api/v1/quizzes/demo/start/protected
 * @access anyone
 */
const getDemoQuiz = asyncHandler(async (req, res) => {
  // generate unique session ID
  const sessionId = uuidv4();

  // Default: 5 questions
  let numberOfQuestions = 5;

  //default 10 minutes expiry
  let ttl = 600;

  // If logged in AND user provided numberOfQuestions, override
  if (req.user && req.query.numberOfQuestions) {
    numberOfQuestions = Math.min(parseInt(req.query.numberOfQuestions, 10) || 5, 50);

    ttl=Math.min(numberOfQuestions * 60 + 300, 3600); // max 1 hr
  }

  // Build trivia API URL
  const url = `https://opentdb.com/api.php?amount=${numberOfQuestions}&type=multiple`;

  // fetch from trivia API
  const triviaRes = await fetch(url);

  const data = await triviaRes.json();

  if (!data.results) {
    throw new ApiError(500, "Failed to fetch trivia questions");
  }

  // decode HTML entities in all fields
  const decodedResults = data.results.map((q) => ({
    ...q,
    question: he.decode(q.question),
    correct_answer: he.decode(q.correct_answer),
    incorrect_answers: q.incorrect_answers.map((ans) => he.decode(ans)),
  }));

  // prepare quiz for frontend (hide correct answers)
  const quizForFrontend = decodedResults.map((q) => {
    const options = [...q.incorrect_answers, q.correct_answer];
    options.sort(() => Math.random() - 0.5); // shuffle
    return {
      question: q.question,
      options,
    };
  });

  // save correct answers in Redis with sessionId
  await redis.set(
    `demoQuiz:${sessionId}`,
    JSON.stringify(decodedResults),
    { ex: ttl } // expire in 10 min
  );

  // console.log(quizForFrontend);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { sessionId, quiz: quizForFrontend },
        "Demo quiz started"
      )
    );
});

/**
 * @desc Get all quizzes by role
 * @route GET /api/v1/quizzes/role-based
 * @access teacher/student
 */

const getQuizzesByRole = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;

  let quizzes;

  if (role === "teacher") {
    // Teacher → see own quizzes with full details
    quizzes = await Quiz.find({ createdBy: _id }).populate(
      "createdBy",
      "fullName email"
    );
  } else if (role === "student") {
    // Student → see all quizzes but without answers
    quizzes = await Quiz.find().populate("createdBy", "fullName email");
  } else {
    throw new ApiError(403, "Invalid role");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, quizzes, "Quizzes fetched successfully"));
});

/**
 * @desc Get quiz by ID
 * @route GET /api/v1/quizzes/:quizId
 * @access teacher/student
 */

const getQuizById = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { role } = req.user;
  const { accessCode } = req.body;
  // console.log(quizId);
  let quiz;

  if (role === "teacher") {
    quiz = await Quiz.findById(quizId).populate([
      { path: "createdBy", select: "fullName email" },
      { path: "questions" },
    ]); // include everything
  } else if (role === "student") {
  quiz = await Quiz.findById(quizId);

  if (!quiz) throw new ApiError(404, "Quiz not found");

  // Check if quiz has a start time set
  if (quiz.startTime && quiz.startTime > new Date()) {
    const timeRemaining = Math.ceil((quiz.startTime - new Date()) / 1000); // in seconds
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          quizId: quiz._id,
          title: quiz.title,
          description: quiz.description,
          startTime: quiz.startTime,
          startsInSeconds: timeRemaining,
        },
        `Quiz hasn't started yet. Starts in ${Math.ceil(timeRemaining / 60)} min(s).`
      )
    );
  }

  if (quiz.isProtected) {
    if (quiz.accessCode !== accessCode) {
      throw new ApiError(403, "Invalid access code");
    }
    if (quiz.accessCodeExpiry && quiz.accessCodeExpiry < new Date()) {
      throw new ApiError(403, "Access code expired");
    }
  }

  quiz = await quiz.populate([
    { path: "createdBy", select: "fullName email" },
    { path: "questions", select: "-correctAnswer" },
  ]);

  quiz.accessCode = undefined;
  quiz.accessCodeExpiry = undefined;
}
 else {
    throw new ApiError(403, "Invalid role");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, quiz, "Access granted and Quiz fetched successfully")
    );
});

/**
 * @desc Update quiz
 * @route PATCH /api/v1/quizzes/:quizId
 * @access Private (Admin/Teacher)
 */
const updateQuiz = asyncHandler(async (req, res) => {
  const { title, description, duration, questions } = req.body;
  const { quizId } = req.params;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");

  if (String(quiz.createdBy) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this quiz");
  }

  // update quiz info
  quiz.title = title || quiz.title;
  quiz.description = description || quiz.description;
  quiz.duration = duration || quiz.duration;

  const incoming = Array.isArray(questions) ? questions : [];

  // --- Step 1: figure out what to delete ---
  const incomingIds = incoming.filter((q) => q._id).map((q) => String(q._id));
  const toDelete = quiz.questions
    .map((id) => String(id))
    .filter((id) => !incomingIds.includes(id));

  if (toDelete.length) {
    await Question.deleteMany({ _id: { $in: toDelete } });
  }

  // --- Step 2: prepare bulk operations for update & insert ---
  const bulkOps = [];
  const finalQuestionIds = [];

  for (const q of incoming) {
    if (q._id) {
      // existing → update
      bulkOps.push({
        updateOne: {
          filter: {
            _id: q._id,
          },
          update: {
            $set: {
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              marks: q.marks,
            },
          },
        },
      });
      finalQuestionIds.push(q._id);
    } else {
      // new → insert
      bulkOps.push({
        insertOne: {
          document: {
            quizId: quiz._id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
          },
        },
      });
    }
  }

  // --- Step 3: run bulkWrite ---
  if (bulkOps.length) {
    const result = await Question.bulkWrite(bulkOps);

    // collect IDs of inserted docs
    if (result.insertedIds) {
      Object.values(result.insertedIds).forEach((id) =>
        finalQuestionIds.push(id.toString())
      );
    }
  }

  // --- Step 4: update quiz with final Q IDs ---
  quiz.questions = finalQuestionIds;

  // recompute total marks
  const total = await Question.aggregate([
    {
      $match: {
        _id: {
          $in: finalQuestionIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$marks" } } },
  ]);

  quiz.totalMarks = total[0] ? total[0].total : 0;

  await quiz.save();

  return res
    .status(200)
    .json(new ApiResponse(200, quiz, "Quiz updated successfully"));
});

/**
 * @desc Delete quiz
 * @route DELETE /api/v1/quizzes/:quizId
 * @access Private (Admin/Teacher)
 */
const deleteQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  // console.log(quizId);

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");

  if (String(quiz.createdBy) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this quiz");
  }
  //delete all the question in one go
  await Question.deleteMany({ _id: { $in: quiz.questions } });

  await quiz.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Quiz deleted successfully"));
});

export {
  createQuiz,
  publishQuiz,
  getQuizzesByRole,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getDemoQuiz,
};
