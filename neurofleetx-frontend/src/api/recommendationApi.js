import axiosInstance from "./axiosInstance";

const API = "/recommendations";

const recommendationApi = {
  // Get vehicle recommendations for booking
  getVehicles: (params) => axiosInstance.post(`${API}/vehicles`, params),

  // Get available vehicles with filters
  getAvailable: (params) => axiosInstance.get(`${API}/available`, { params }),

  // Get fleet maintenance analytics
  getFleetAnalytics: () =>
    axiosInstance.get(`${API}/maintenance/fleet-analytics`),

  // Check specific vehicle maintenance
  checkVehicleHealth: (vehicleId) =>
    axiosInstance.get(`${API}/maintenance/${vehicleId}`),

  // Get critical vehicles
  getCritical: () => axiosInstance.get(`${API}/maintenance/critical-vehicles`),
};

export default recommendationApi;
