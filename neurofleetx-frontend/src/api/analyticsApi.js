import axiosInstance from "./axiosInstance";

const analyticsApi = {
  // Fleet Distribution
  getFleetDistribution: () =>
    axiosInstance.get("/api/analytics/fleet-distribution"),

  // Trip Heatmap
  getTripHeatmap: (startDate, endDate) =>
    axiosInstance.get("/api/analytics/trip-heatmap", {
      params: { startDate, endDate },
    }),

  // KPI Summary
  getKPISummary: () => axiosInstance.get("/api/analytics/kpi-summary"),

  // Hourly Activity
  getHourlyActivity: (date) =>
    axiosInstance.get("/api/analytics/hourly-activity", {
      params: { date },
    }),

  // Vehicle Utilization
  getVehicleUtilization: () =>
    axiosInstance.get("/api/analytics/vehicle-utilization"),

  // Revenue Trends
  getRevenueTrends: (days = 7) =>
    axiosInstance.get("/api/analytics/revenue-trends", {
      params: { days },
    }),

  // Export CSV
  exportCSV: (reportType, startDate, endDate) =>
    axiosInstance.get("/api/analytics/export/csv", {
      params: { reportType, startDate, endDate },
      responseType: "blob",
    }),

  // Export PDF
  exportPDF: (reportType, startDate, endDate) =>
    axiosInstance.get("/api/analytics/export/pdf", {
      params: { reportType, startDate, endDate },
      responseType: "blob",
    }),
};

export default analyticsApi;
