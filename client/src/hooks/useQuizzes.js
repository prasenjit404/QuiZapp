import { useQuery } from "@tanstack/react-query";
import { getRoleBasedQuizzes, getQuiz } from "../api/quizzesApi";

export const useRoleQuizzes = () => {
  return useQuery(["roleQuizzes"], getRoleBasedQuizzes, {
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });
};

export const useQuiz = (quizId) => {
  return useQuery(["quiz", quizId], () => getQuiz(quizId), {
    enabled: !!quizId,
  });
};
