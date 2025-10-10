import React, { createContext, useContext, useEffect, useReducer, useState } from "react";
import axiosClient, { setAuthToken } from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import {startDemoAPI} from '../api/quizzesApi'

const QuizContext = createContext();

export function QuizeProvider({ children }) {
  const [demoQuizData,setDemoQuizData] = useState(null)
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const getDemoQuiz = async() =>{
    const res = await startDemoAPI();
    console.log("res in getDemoQuiz", res)
    return res
  }

  const value = {
    loading,
    getDemoQuiz
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export const useQuiz = () => useContext(QuizContext);
