import axiosInstance from "./axiosInstance";

const analyticsApi = {
  // Fleet Distribution
  getFleetDistribution: () =>
    axiosInstance.get("/analytics/fleet-distribution"),

  // Trip Heatmap
  getTripHeatmap: (startDate, endDate) =>
    axiosInstance.get("/analytics/trip-heatmap", {
      params: { startDate, endDate },
    }),

  // KPI Summary
  getKPISummary: () => axiosInstance.get("/analytics/kpi-summary"),

  // Hourly Activity
  getHourlyActivity: (date) =>
    axiosInstance.get("/analytics/hourly-activity", {
      params: { date },
    }),

  // Vehicle Utilization
  getVehicleUtilization: () =>
    axiosInstance.get("/analytics/vehicle-utilization"),

  // Revenue Trends
  getRevenueTrends: (days = 7) =>
    axiosInstance.get("/analytics/revenue-trends", {
      params: { days },
    }),

  // Export CSV
  exportCSV: (reportType, startDate, endDate) =>
    axiosInstance.get("/analytics/export/csv", {
      params: { reportType, startDate, endDate },
      responseType: "blob",
    }),

  // Export PDF
  exportPDF: (reportType, startDate, endDate) =>
    axiosInstance.get("/analytics/export/pdf", {
      params: { reportType, startDate, endDate },
      responseType: "blob",
    }),
};

export default analyticsApi;
