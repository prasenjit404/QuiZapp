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
  const [accessToken, setAccessToken] = useState(null); // in-memory only
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        // 1️⃣ Try fetching current user
        const res = await axiosClient.get("/users/current-user");
        if (!mounted) return;
        const currentUser = res.data?.data?.user || null;
        const token = res.data?.data?.accessToken || null;

        if (currentUser) setUser(currentUser);
        if (token) {
          setAccessToken(token);
          setAuthToken(token);
        }
      } catch (err) {
        // 2️⃣ Try refresh token if current-user fails
        try {
          const refresh = await axiosClient.post("/users/refresh-token");
          const token = refresh.data?.data?.accessToken;
          if (token) {
            setAccessToken(token);
            setAuthToken(token);
            const me = await axiosClient.get("/users/current-user", {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUser(me.data?.data?.user || null);
          }
        } catch (e) {
          console.warn("Session expired or refresh failed");
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem("user");
        }
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

      navigate("/dashboard");
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
