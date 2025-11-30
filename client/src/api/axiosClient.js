import axios from "axios";

// If using Proxy, we leave the base empty (or just the path)
// The browser will append this to the current origin (http://localhost:5173)
// The proxy will then catch '/api' and forward it to the backend.
const axiosClient = axios.create({
  baseURL: "/api/v1", 
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