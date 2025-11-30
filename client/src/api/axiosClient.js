import axios from "axios";

// 1. In Production (Vercel), use the Env Variable.
// 2. In Development (Local), use the Vite Proxy (relative path).
// NOTE: Make sure you do NOT have a trailing slash in your Vercel Env Var.
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : "/api/v1"; 

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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