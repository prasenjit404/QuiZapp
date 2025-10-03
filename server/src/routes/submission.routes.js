import { Router } from "express";
import {
  submitQuiz,
  getSubmissionByQuiz,
  getAllSubmissionsByQuiz,
  getUserQuizHistory,
  submitDemoQuiz,
} from "../controllers/submission.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Demo quiz submission only for guest user
router.route("/demo/submit").post(submitDemoQuiz);

// All submission routes are protected
router.use(verifyJWT);

// 1. Student submits a quiz
router.route("/submit").post(submitQuiz);

// 2. Student gets their own submission for a quiz
router.route("/:quizId/student").get(getSubmissionByQuiz);

// 3. Student gets all the attempted quiz history
router.route("/history").get(getUserQuizHistory);

// 4. Teacher/Admin gets all submissions for a quiz
router.route("/:quizId/admin").get(getAllSubmissionsByQuiz);

// 5. Demo quiz submission
router.route("/demo/submit/protected").post(submitDemoQuiz);

export default router;
