import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema({
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      validate: [
        (val) => val.length >= 2,
        "A question must have at least 2 options",
      ],
    },
    correctAnswer: {
      type: String, // or store index if you want faster lookups
      required: true,
    },
    marks: {
      type: Number,
      default: 1,
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true });

export const Question = mongoose.model("Question", questionSchema);
