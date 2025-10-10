import axiosClient from "./axiosClient";

export const getRoleBasedQuizzes = () => axiosClient.get("/quizzes/role-based");
export const getQuiz = (quizId) => axiosClient.get(`/quizzes/${quizId}`);
export const createQuiz = (payload) => axiosClient.post("/quizzes", payload);
export const publishQuiz = (quizId) => axiosClient.post(`/quizzes/${quizId}/publish`);
export const startDemoAPI= () => axiosClient.get("/quizzes/demo/start");
