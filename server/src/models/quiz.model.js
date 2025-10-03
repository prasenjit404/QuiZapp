import mongoose, { Schema } from "mongoose";

const quizSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    duration: {
      type: Number, // in minutes (or seconds if you want)
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    isProtected: {
      type: Boolean,
      default: false,
    }, // if true → needs OTP
    accessCode: {
      type: String,
    }, // OTP / passcode
    accessCodeExpiry: {
      type: Date,
    }, // optional, e.g., valid for 2 hours
    startTime: { 
      type: Date 
    }, // when quiz will be available to students
  },
  { timestamps: true }
);

export const Quiz = mongoose.model("Quiz", quizSchema);
