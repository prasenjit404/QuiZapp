import { Router } from "express";
import {
  addQuestion,
  getQuestionsByQuiz,
  getQuestionsByQuizForStudent,
  getQuestionById,
  getQuestionByIdForStudent,
  updateQuestion,
  deleteQuestion,
} from "../controllers/question.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes protected (only authenticated users can access)
router.use(verifyJWT);

// add a question
router.route("/").post(addQuestion);

// Get all questions for a quiz (admin/teacher view)
router.route("/quiz/:quizId/admin").get(getQuestionsByQuiz);

// Get all questions for a quiz (student view, no correctAnswer)
router.route("/quiz/:quizId/student").get(getQuestionsByQuizForStudent);

// Single question (admin/teacher)
router.route("/:id/admin").get(getQuestionById);

// Single question (student, no correctAnswer)
router.route("/:id/student").get(getQuestionByIdForStudent);

// Update & delete (admin only ideally)
router.route("/:id").patch(updateQuestion).delete(deleteQuestion);

export default router;
