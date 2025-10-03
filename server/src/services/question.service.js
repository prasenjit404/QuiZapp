import { Question } from "../models/question.model.js";
import { Quiz } from "../models/quiz.model.js";
import { ApiError } from "../utils/ApiError.js";

// services/question.service.js
export const createQuestionService = async ({
  quizId,
  text,
  options,
  correctAnswer,
  marks,
  negativeMarks,
}) => {
  const question = await Question.create({
    quizId,
    text,
    options,
    correctAnswer,
    marks,
    negativeMarks,
  });

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");
  quiz.questions.push(question._id);

  await quiz.save();

  return question;
};
