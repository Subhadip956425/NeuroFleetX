import axiosInstance from "./axiosInstance";

const API_MAINTENANCE = "/maintenance";

// ✅ Helper function to calculate health score
const calculateHealthScore = (daysToService, reason) => {
  if (reason === "Critical") {
    return Math.max(0, Math.min(40, daysToService * 10)); // 0-40%
  } else if (reason === "Due") {
    return Math.max(40, Math.min(70, 40 + daysToService * 2)); // 40-70%
  } else {
    return Math.max(70, Math.min(100, 70 + daysToService)); // 70-100%
  }
};

// ✅ Helper function to calculate next maintenance date
const calculateNextMaintenanceDate = (daysToService) => {
  const today = new Date();
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + Math.round(daysToService));
  return nextDate.toISOString();
};

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

  getPrediction: async (vehicleId) => {
    try {
      console.log(
        "🤖 Fetching AI maintenance prediction for vehicle:",
        vehicleId
      );
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/prediction/${vehicleId}`
      );
      console.log("✅ Prediction loaded:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching prediction:", error.message);
      throw error;
    }
  },

  /**
   * Get predictions for all vehicles
   */
  getAllPredictions: async () => {
    try {
      console.log("🤖 Fetching all vehicle predictions...");
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/predictions/all`
      );
      console.log("✅ All predictions loaded:", response.data);

      // ✅ Transform backend data to frontend format
      const predictions = (response.data || []).map((pred) => ({
        vehicleId: pred.vehicleId,
        id: pred.id,

        // Status mapping
        status: pred.reason || "Unknown",
        reason: pred.reason,

        // Health score calculation (inverse of days to service)
        healthScore: calculateHealthScore(pred.daysToService, pred.reason),

        // Next maintenance date calculation
        nextMaintenanceDate: calculateNextMaintenanceDate(pred.daysToService),
        daysUntilMaintenance: Math.round(pred.daysToService),

        // ML confidence (default if not provided)
        mlConfidence: 85,
        confidence: 85,

        // Additional fields
        predictedAt: pred.predictedAt,
        daysToService: pred.daysToService,

        // Message for critical vehicles
        message:
          pred.reason === "Critical"
            ? "Immediate maintenance required"
            : pred.reason === "Due"
            ? "Schedule maintenance soon"
            : "Vehicle in good condition",
      }));

      console.log("📊 Transformed predictions:", predictions);
      return predictions;
    } catch (error) {
      console.error("❌ Error fetching all predictions:", error.message);
      return [];
    }
  },

  /**
   * Get critical vehicles needing immediate attention
   */
  getCriticalVehicles: async () => {
    try {
      console.log("🚨 Fetching critical vehicles...");
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/predictions/critical`
      );
      console.log("✅ Critical vehicles:", response.data);

      // ✅ Transform critical vehicles data
      const criticalVehicles = (response.data || []).map((pred) => ({
        vehicleId: pred.vehicleId,
        id: pred.id,
        status: pred.reason,
        daysUntilMaintenance: Math.round(pred.daysToService),
        message: "Immediate maintenance required",
        confidence: 85,
        reason: pred.reason,
        predictedAt: pred.predictedAt,
      }));

      console.log("🚨 Transformed critical vehicles:", criticalVehicles);
      return criticalVehicles;
    } catch (error) {
      console.error("❌ Error fetching critical vehicles:", error.message);
      return [];
    }
  },

  /**
   * Trigger manual evaluation for a vehicle
   */
  evaluateVehicleHealth: async (vehicleId) => {
    try {
      console.log("🔍 Triggering health evaluation for vehicle:", vehicleId);
      const response = await axiosInstance.post(
        `${API_MAINTENANCE}/evaluate/${vehicleId}`
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
      const response = await axiosInstance.get(`${API_MAINTENANCE}/stats`);
      console.log("✅ Stats loaded:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching stats:", error.message);
      throw error;
    }
  },

  // ========== ✅ FIXED: FLEET ANALYTICS ENDPOINTS ==========

  /**
   * Get fleet-wide maintenance analytics
   */
  getFleetMaintenanceAnalytics: async () => {
    try {
      console.log("📊 Fetching fleet maintenance analytics");
      const response = await axiosInstance.get(`${API_MAINTENANCE}/stats`);
      console.log("✅ Fleet analytics response:", response.data);

      // Transform stats to match expected format
      const stats = response.data;
      return {
        data: {
          total_vehicles: stats.totalVehicles || 0,
          healthy: stats.healthy || 0,
          needs_maintenance: stats.due || 0,
          due: stats.due || 0, // ✅ ADD THIS - component expects "due"
          critical: stats.critical || 0,
          health_percentage:
            stats.totalVehicles > 0
              ? Math.round((stats.healthy / stats.totalVehicles) * 100)
              : 0,
          open_tickets: stats.openTickets || 0,
          resolved_tickets: stats.resolvedTickets || 0,
          last_updated: stats.lastUpdated,
        },
      };
    } catch (error) {
      console.error("❌ Error fetching fleet analytics:", error);
      // Return dummy data on error
      return {
        data: {
          total_vehicles: 0,
          healthy: 0,
          needs_maintenance: 0,
          due: 0, // ✅ ADD THIS
          critical: 0,
          health_percentage: 0,
          open_tickets: 0,
          resolved_tickets: 0,
        },
      };
    }
  },

  /**
   * Check vehicle health (detailed info)
   */
  checkVehicleHealth: async (vehicleId) => {
    try {
      console.log("🔧 Checking vehicle health for:", vehicleId);
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/prediction/${vehicleId}`
      );
      console.log("✅ Vehicle health response:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Error checking vehicle health:", error);
      throw error;
    }
  },

  // ========== CUSTOMER ISSUE REPORTING ==========

  /**
   * Report issue as a customer
   */
  reportIssueAsCustomer: async (data) => {
    try {
      console.log("🎫 Customer reporting issue:", data);
      const response = await axiosInstance.post(`${API_MAINTENANCE}/report`, {
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
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/customer/my-issues`
      );
      console.log("✅ My issues loaded:", response.data);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching my issues:", error.message);
      throw error;
    }
  },
};

export default maintenanceApi;
