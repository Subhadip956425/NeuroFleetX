import axios from "axios";
import axiosInstance from "./axiosInstance";

const API_URL = "http://localhost:8080/api/auth";

export const registerUser = (data) => axios.post(`${API_URL}/register`, data);

// All auth-related API calls
const authApi = {
  login: (email, password) =>
    axiosInstance.post("/auth/login", { email, password }),
  getProfile: () => axiosInstance.get("/auth/me"),

  // Password Reset Endpoints
  forgotPassword: (email) =>
    axiosInstance.post("/auth/forgot-password", { email }),
  verifyResetToken: (token) =>
    axiosInstance.get(`/auth/verify-reset-token?token=${token}`),
  resetPassword: (token, newPassword) =>
    axiosInstance.post("/auth/reset-password", { token, newPassword }),
};

export default authApi;
