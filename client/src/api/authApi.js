import axiosClient from "./axiosClient";

export const loginAPI = (email, password) =>
  axiosClient.post("/users/login", { email, password });

export const logoutAPI = () =>
  axiosClient.post("/users/logout");

export const refreshTokenAPI = () =>
  axiosClient.post("/users/refresh-token");
