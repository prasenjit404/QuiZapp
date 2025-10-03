import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Question } from "../models/question.model.js";
import { Quiz } from "../models/quiz.model.js";
import { createQuestionService } from "../services/question.service.js";

// 1. Create Question
const addQuestion = asyncHandler(async (req, res) => {
  const { quizId, text, options, correctAnswer, marks, negativeMarks } = req.body;

  if (!quizId || !text || !options || !correctAnswer) {
    throw new ApiError(400, "quizId, text, options, and correctAnswer are required");
  }

  // if (!mongoose.Types.ObjectId.isValid(quizId)) {
  //   throw new ApiError(400, "Invalid quiz ID");
  // }

  // const quiz = await Quiz.findById(quizId);
  // if (!quiz) throw new ApiError(404, "Quiz not found");

  const question = await createQuestionService(req.body);

  return res.status(201).json(new ApiResponse(201, question, "Question created successfully"));
});

// 2. Get all questions of a quiz (admin/teacher view, includes correctAnswer)
const getQuestionsByQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new ApiError(400, "Invalid quiz ID");
  }

  const questions = await Question.find({ quizId });

  return res
    .status(200)
    .json(new ApiResponse(200, questions, "Questions fetched successfully"));
});

// 2b. Get all questions for student (hide correctAnswer)
const getQuestionsByQuizForStudent = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new ApiError(400, "Invalid quiz ID");
  }

  const questions = await Question.find({ quizId }).select(
    "text options marks negativeMarks"
  ); // exclude correctAnswer

  return res
    .status(200)
    .json(new ApiResponse(200, questions, "Questions fetched for student"));
});

// 3. Get single question
const getQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid question ID");
  }

  const question = await Question.findById(id);
  if (!question) throw new ApiError(404, "Question not found");

  return res
    .status(200)
    .json(new ApiResponse(200, question, "Question fetched successfully"));
});

// 3b. Get single question for student (no correctAnswer)
const getQuestionByIdForStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid question ID");
  }

  const question = await Question.findById(id).select(
    "text options marks negativeMarks"
  );

  if (!question) throw new ApiError(404, "Question not found");

  return res
    .status(200)
    .json(new ApiResponse(200, question, "Question fetched for student"));
});

// 4. Update question
const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text, options, correctAnswer, marks, negativeMarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid question ID");
  }

  const question = await Question.findById(id);
  if (!question) throw new ApiError(404, "Question not found");

  if (text) question.text = text;
  if (options) question.options = options;
  if (correctAnswer) question.correctAnswer = correctAnswer;
  if (marks !== undefined) question.marks = marks;
  if (negativeMarks !== undefined) question.negativeMarks = negativeMarks;

  await question.save();

  return res
    .status(200)
    .json(new ApiResponse(200, question, "Question updated successfully"));
});

// 5. Delete question
const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid question ID");
  }

  const question = await Question.findById(id);
  if (!question) throw new ApiError(404, "Question not found");

  // Remove reference from quiz
  await Quiz.findByIdAndUpdate(question.quizId, {
    $pull: { questions: question._id },
  });

  await question.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Question deleted successfully"));
});

export {
  addQuestion,
  getQuestionsByQuiz,
  getQuestionsByQuizForStudent,
  getQuestionById,
  getQuestionByIdForStudent,
  updateQuestion,
  deleteQuestion,
};
