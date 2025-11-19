import axiosInstance from "./axiosInstance";

const maintenanceApi = {
  // ========== EXISTING METHODS (Keep as-is) ==========
  getMyTickets: async () => {
    try {
      const response = await axiosInstance.get(`/driver/my-tickets`);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching my tickets:", error.message);
      throw error;
    }
  },

  getTicketsForVehicle: async (vehicleId) => {
    try {
      const response = await axiosInstance.get(
        `/maintenance/tickets/vehicle/${vehicleId}`
      );
      return response.data || [];
    } catch (error) {
      console.error("❌ Error:", error.message);
      throw error;
    }
  },

  reportIssue: async (data) => {
    try {
      const response = await axiosInstance.post(`/maintenance/report`, data);
      return response.data;
    } catch (error) {
      console.error("❌ Error reporting issue:", error.message);
      throw error;
    }
  },

  reportIssueAsDriver: async (data) => {
    try {
      const response = await axiosInstance.post(`/driver/report-issue`, data);
      return response.data;
    } catch (error) {
      console.error("❌ Error reporting driver issue:", error.message);
      throw error;
    }
  },

  getOpenTickets: async () => {
    try {
      const response = await axiosInstance.get(`/maintenance/tickets`);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching open tickets:", error.message);
      throw error;
    }
  },

  getResolvedTickets: async () => {
    try {
      const response = await axiosInstance.get(`/maintenance/resolved/tickets`);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching resolved tickets:", error.message);
      throw error;
    }
  },

  getAllTickets: async () => {
    try {
      const response = await axiosInstance.get(`/maintenance/all/tickets`);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching all tickets:", error.message);
      throw error;
    }
  },

  updateTicketStatus: async (ticketId, status) => {
    try {
      const response = await axiosInstance.put(
        `/maintenance/${ticketId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error updating status:", error.message);
      throw error;
    }
  },

  resolveTicket: async (ticketId) => {
    try {
      const response = await axiosInstance.put(
        `/maintenance/tickets/${ticketId}/resolve`
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error resolving ticket:", error.message);
      throw error;
    }
  },

  createTicket: async (data) => {
    try {
      const response = await axiosInstance.post(`/maintenance/tickets`, data);
      return response.data;
    } catch (error) {
      console.error("❌ Error creating ticket:", error.message);
      throw error;
    }
  },

  getVehicleReadings: async (vehicleId) => {
    try {
      const response = await axiosInstance.get(
        `/maintenance/readings/${vehicleId}`
      );
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching readings:", error.message);
      throw error;
    }
  },

  submitReading: async (data) => {
    try {
      const response = await axiosInstance.post(`/maintenance/readings`, data);
      return response.data;
    } catch (error) {
      console.error("❌ Error submitting reading:", error.message);
      throw error;
    }
  },

  // ========== ✅ NEW: AI-POWERED MAINTENANCE PREDICTION ==========

  /**
   * Get AI-powered maintenance prediction for a specific vehicle
   * Uses ML model + threshold analysis
   */
  getPrediction: async (vehicleId) => {
    try {
      console.log(
        "🤖 Fetching AI maintenance prediction for vehicle:",
        vehicleId
      );
      const response = await axiosInstance.get(
        `/maintenance/prediction/${vehicleId}`
      );
      console.log("✅ Prediction loaded:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching prediction:", error.message);
      throw error;
    }
  },

  /**
   * Get predictions for all vehicles (Admin/Manager view)
   */
  getAllPredictions: async () => {
    try {
      console.log("🤖 Fetching all vehicle predictions...");
      const response = await axiosInstance.get(`/maintenance/predictions/all`);
      console.log("✅ All predictions loaded:", response.data);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching all predictions:", error.message);
      throw error;
    }
  },

  /**
   * Get critical vehicles needing immediate attention
   */
  getCriticalVehicles: async () => {
    try {
      console.log("🚨 Fetching critical vehicles...");
      const response = await axiosInstance.get(
        `/maintenance/predictions/critical`
      );
      console.log("✅ Critical vehicles:", response.data);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching critical vehicles:", error.message);
      throw error;
    }
  },

  /**
   * Trigger manual evaluation for a vehicle
   * Calls ML service and saves prediction
   */
  evaluateVehicleHealth: async (vehicleId) => {
    try {
      console.log("🔍 Triggering health evaluation for vehicle:", vehicleId);
      const response = await axiosInstance.post(
        `/maintenance/evaluate/${vehicleId}`
      );
      console.log("✅ Evaluation complete:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error evaluating vehicle:", error.message);
      throw error;
    }
  },

  /**
   * Get maintenance statistics and analytics
   */
  getMaintenanceStats: async () => {
    try {
      console.log("📊 Fetching maintenance statistics...");
      const response = await axiosInstance.get(`/maintenance/stats`);
      console.log("✅ Stats loaded:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching stats:", error.message);
      throw error;
    }
  },

  // ========== ✅ NEW: CUSTOMER ISSUE REPORTING ==========

  /**
   * Report issue as a customer (for active bookings)
   */
  /**
   * Report issue as a customer (for active bookings)
   */
  reportIssueAsCustomer: async (data) => {
    try {
      console.log("🎫 Customer reporting issue:", data);

      // ✅ TEMPORARY FIX: Use maintenance/report endpoint instead
      const response = await axiosInstance.post(`/maintenance/report`, {
        vehicleId: data.vehicleId,
        description: data.description,
        severity: data.severity || "MEDIUM",
      });

      console.log("✅ Customer issue reported:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error reporting customer issue:", error.message);
      throw error;
    }
  },

  /**
   * Get customer's reported issues
   */
  getMyReportedIssues: async () => {
    try {
      console.log("📋 Fetching my reported issues...");
      const response = await axiosInstance.get(`/customer/my-issues`);
      console.log("✅ My issues loaded:", response.data);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching my issues:", error.message);
      throw error;
    }
  },
};

export default maintenanceApi;
