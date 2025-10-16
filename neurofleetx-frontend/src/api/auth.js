import axios from "axios";
import axiosInstance from "./axiosInstance";

const API_URL = "http://localhost:8080/api/auth";

export const registerUser = (data) => axios.post(`${API_URL}/register`, data);

// All auth-related API calls
const authApi = {
  login: (email, password) =>
    axiosInstance.post("/auth/login", { email, password }),
  getProfile: () => axiosInstance.get("/auth/me"),
};

export default authApi;
