import React, { createContext, useContext, useEffect, useState } from "react";
import axiosClient, { setAuthToken } from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        // 1️⃣ Always try to refresh token first on load
        // This ensures we get a fresh Access Token string for the headers
        const refreshRes = await axiosClient.post("/users/refresh-token");
        const token = refreshRes.data?.data?.accessToken;

        if (token) {
          setAccessToken(token);
          setAuthToken(token); // Set the header immediately

          // 2️⃣ Now fetch the current user details using the valid header
          const userRes = await axiosClient.get("/users/current-user");
          const currentUser = userRes.data?.data?.user || userRes.data?.data;

          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem("user", JSON.stringify(currentUser));
          }
        } else {
          throw new Error("No token returned");
        }
      } catch (err) {
        console.warn("Session initialization failed:", err);
        // If refresh fails, clear everything
        setUser(null);
        setAccessToken(null);
        setAuthToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => (mounted = false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await loginAPI(email, password);
      const token = res?.data?.data?.accessToken;
      const loggedInUser = res?.data?.data?.user;

      if (token) {
        setAuthToken(token);
        setAccessToken(token);
        localStorage.setItem("token", token);
      }

      if (loggedInUser) {
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
      }

      navigate("/"); // Redirect to dashboard/home
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post("/users/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setAuthToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const value = {
    user,
    accessToken,
    setAccessToken,
    setUser,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);