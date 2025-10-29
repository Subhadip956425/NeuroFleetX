// src/api/maintenanceApi.js
import axiosInstance from "./axiosInstance";

const maintenanceApi = {
  // 🔹 Health & Telemetry Data
  ingestReading: (reading) =>
    axiosInstance.post("/maintenance/readings", reading),
  getReadings: (vehicleId) =>
    axiosInstance.get(`/maintenance/readings/${vehicleId}`),

  // 🔹 Maintenance Analytics (for Admin Dashboard)
  getAnalytics: () => axiosInstance.get("/maintenance/analytics"),

  // 🔹 Tickets (Fleet-wide or by Vehicle)
  getOpenTickets: () => axiosInstance.get("/maintenance/tickets?status=OPEN"),
  getTicketsForVehicle: (vehicleId) =>
    axiosInstance.get(`/api/maintenance/tickets/vehicle/${vehicleId}`),

  // ✅ FIXED: Use correct endpoint from DriverController
  getMyTickets: () => axiosInstance.get("/driver/my-tickets"),

  // 🔹 Ticket CRUD (admin/manager)
  createTicket: (payload) =>
    axiosInstance.post("/maintenance/tickets", payload),
  updateTicket: (ticketId, ticketData) =>
    axiosInstance.put(`/maintenance/tickets/${ticketId}`, ticketData),
  resolveTicket: (ticketId) =>
    axiosInstance.put(`/maintenance/tickets/${ticketId}/resolve`),

  // 🔹 Manager actions
  assignTechnician: (ticketId, technicianId) =>
    axiosInstance.put(
      `/maintenance/tickets/${ticketId}/assign/${technicianId}`
    ),

  // ✅ FIXED: Use correct endpoint from MaintenanceController
  reportIssueAsDriver: (payload) =>
    axiosInstance.post("/maintenance/report", payload), // ✅ Changed from /api/driver/report
};

export default maintenanceApi;
