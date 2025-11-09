import { Router } from "express";
import {
  createQuiz,
  getAllCreatedQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  getDemoQuiz,
} from "../controllers/quiz.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// only for guest user(non protected)
router.route("/demo/start").get(getDemoQuiz);

// Protect all quiz routes
router.use(verifyJWT);

router.route("/create-quiz").post(createQuiz); // create quiz

router.route("/:quizId/publish").post(publishQuiz);

router.route("/created-all").get(getAllCreatedQuizzes); // get all quizzes

router
  .route("/:quizId")
  .get(getQuizById) // get single quiz
  .patch(updateQuiz) // update quiz
  .delete(deleteQuiz); // delete quiz

// get random quiz for logged in user
router.route("/demo/start/protected").get(getDemoQuiz);

export default router;
