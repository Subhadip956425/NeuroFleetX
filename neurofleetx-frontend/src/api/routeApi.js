// Purpose: REST calls for Module 3 routes (create, assign, list, update, optimize)
import axios from "./axiosInstance"; // pre-configured baseURL + JWT interceptor

const API = "/routes";

const routeApi = {
  // 🚀 Manager creates route (backend calls AI microservice)
  createRoute: (payload) => axios.post(`${API}/create`, payload),

  // 🚗 Manager assigns driver & vehicle
  // POST /routes/assign/{routeId}?driverId=...&vehicleId=...
  assignRoute: (routeId, driverId, vehicleId) =>
    axios.post(`${API}/assign/${routeId}`, null, {
      params: { driverId, vehicleId },
    }),

  // 📋 Manager: list all routes
  getManagerRoutes: () => axios.get(`${API}/manager`),

  // ⚙️ Driver: fetch assigned routes
  getDriverRoutes: (driverId) => axios.get(`${API}/driver/${driverId}`),

  // ⚙️ Driver: update route status (e.g., STARTED, COMPLETED)
  updateRouteStatus: (routeId, status) =>
    axios.patch(`${API}/status/${routeId}`, null, { params: { status } }),

  // 🔎 Optional: list/filter routes (Admin)
  filterRoutes: (status, driverId) => {
    const params = {};
    if (status) params.status = status;
    if (driverId) params.driverId = driverId;
    return axios.get(`${API}/all`, { params });
  },

  // 🧠 AI Optimization: optional endpoint for real-time re-optimization
  optimizeRoute: (routeData) => axios.post(`${API}/optimize`, routeData),
};

export default routeApi;
