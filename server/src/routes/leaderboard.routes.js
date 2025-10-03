import { Router } from "express";
import {
  getLeaderboard,
  resetLeaderboard,
} from "../controllers/leaderboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all leaderboard routes
router.use(verifyJWT);

router
  .route("/:quizId")
  .get(getLeaderboard) // get leaderboard for quiz
  .delete(resetLeaderboard); // reset leaderboard (admin use)

export default router;
