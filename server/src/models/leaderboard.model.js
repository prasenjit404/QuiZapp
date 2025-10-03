import mongoose, { Schema } from "mongoose";

const leaderboardSchema = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    scores: [
      {
        studentId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        timeTaken: {
          type: Number,
          required: true,
        },
        rank: {
          type: Number,
          default: null,
        },
        submittedAt: {
          type: Date,
          default: Date.now, // auto-set on new submissions
        },
      },
    ],
  },
  { timestamps: true }
);

export const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);
