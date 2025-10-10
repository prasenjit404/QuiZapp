import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL

const axiosClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send cookies if backend uses httpOnly refresh token
  headers: {
    "Content-Type": "application/json",
  },
});

// helpers: set/clear auth token (in-memory header)
export function setAuthToken(token) {
  if (token) {
    axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosClient.defaults.headers.common["Authorization"];
  }
}

export function clearAuthToken() {
  delete axiosClient.defaults.headers.common["Authorization"];
}

export default axiosClient;
