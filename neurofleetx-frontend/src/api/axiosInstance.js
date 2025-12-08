import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://neurofleetx.onrender.com/api",
  timeout: 30000,
});

// ✅ REQUEST INTERCEPTOR - Add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR - Handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("userRole");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
