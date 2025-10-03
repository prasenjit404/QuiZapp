import { Leaderboard } from "../models/leaderboard.model.js";
import { Submission } from "../models/submission.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. Update leaderboard after submission
const updateLeaderboard = async (quizId, studentId, score, timeTaken) => {
  let leaderboard = await Leaderboard.findOne({ quizId });

  if (!leaderboard) {
    leaderboard = await Leaderboard.create({
      quizId,
      scores: [{ studentId, score, timeTaken, submittedAt: Date.now() }],
    });
  } else {
    leaderboard.scores.push({
      studentId,
      score,
      timeTaken,
      submittedAt: Date.now(),
    });
  }

  // Sort by score + earliest submission
  leaderboard.scores.sort((a, b) => {
    if (b.score === a.score) {
      return a.timeTaken - b.timeTaken; // less time is better
    }
    return b.score - a.score;
  });

  // Assign ranks (with ties handled) Dense rank
  let currentRank = 1;
  leaderboard.scores.forEach((entry, index) => {
    if (
      index > 0 &&
      entry.score === leaderboard.scores[index - 1].score &&
      entry.timeTaken === leaderboard.scores[index - 1].timeTaken
    ) {
      // Same score + same time → tie
      entry.rank = leaderboard.scores[index - 1].rank;
    } else {
      entry.rank = currentRank;
      currentRank++;
    }
  });

  // Keep only top 10
  leaderboard.scores = leaderboard.scores.slice(0, 10);

  await leaderboard.save();
  return leaderboard;
};

// 2. Get leaderboard for a quiz
const getLeaderboard = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const leaderboard = await Leaderboard.findOne({ quizId }).populate(
    "scores.studentId",
    "fullName"
  );

  if (!leaderboard) throw new ApiError(404, "Leaderboard not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, leaderboard, "Leaderboard fetched successfully")
    );
});

// 3. Reset leaderboard (admin use)
const resetLeaderboard = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  if (req.user.role !== "teacher") {
    throw new ApiError(403, "You are not authorized to reset leaderboard");
  }

  const result = await Leaderboard.updateOne(
    { quizId },
    { $set: { scores: [] } }
  );

  if (result.matchedCount === 0) {
    throw new ApiError(404, "Leaderboard not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Leaderboard reset successfully"));
});

export { updateLeaderboard, getLeaderboard, resetLeaderboard };
