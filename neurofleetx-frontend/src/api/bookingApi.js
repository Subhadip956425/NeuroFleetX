import axiosInstance from "./axiosInstance";
import axios from "axios";

const API = "/bookings";
const API_CUSTOMER = "/customer";
const API_RECOMMENDATIONS = "/recommendations"; // ✅ NEW
const API_MAINTENANCE = "/maintenance"; // ✅ NEW

const bookingApi = {
  // ==================== CUSTOMER ENDPOINTS ====================

  // ✅ Get current customer's bookings (uses JWT token)
  getMyBookings: async () => {
    try {
      console.log("📌 Calling GET /customer/bookings/me");
      const response = await axiosInstance.get(`${API_CUSTOMER}/bookings/me`);
      console.log("✅ getMyBookings response:", response);
      return response;
    } catch (error) {
      console.error("❌ Error in getMyBookings:", error);
      throw error;
    }
  },

  // ✅ Get customer profile
  getCustomerProfile: async () => {
    try {
      const response = await axiosInstance.get(`${API_CUSTOMER}/profile`);
      return response;
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      throw error;
    }
  },

  // ✅ Create a new booking
  createBooking: (bookingData) =>
    axiosInstance.post(`${API}/create`, bookingData),

  // ✅ Get customer's bookings by ID
  getCustomerBookings: (customerId) =>
    axiosInstance.get(`${API}/customer/${customerId}`),

  // ✅ Cancel booking
  cancelBooking: (bookingId, customerId) =>
    axiosInstance.put(`${API}/cancel/${bookingId}?customerId=${customerId}`),

  // ==================== DRIVER ENDPOINTS ====================

  // ✅ Get pending bookings for current driver (JWT identifies driver)
  getPendingBookings: async () => {
    try {
      const response = await axiosInstance.get(`${API}/driver/pending`);
      return response;
    } catch (error) {
      console.error("❌ Error fetching pending bookings:", error);
      throw error;
    }
  },

  // ✅ Get confirmed bookings for current driver (JWT identifies driver)
  getConfirmedBookings: async () => {
    try {
      const response = await axiosInstance.get(`${API}/driver/confirmed`);
      return response;
    } catch (error) {
      console.error("❌ Error fetching confirmed bookings:", error);
      throw error;
    }
  },

  // ✅ Driver accept booking
  acceptBooking: (bookingId) =>
    axiosInstance.put(`${API}/driver/${bookingId}/accept`),

  // ✅ Driver reject booking
  rejectBooking: (bookingId, reason) =>
    axiosInstance.put(`${API}/driver/${bookingId}/reject`, {
      reason,
    }),

  // ==================== MANAGER ENDPOINTS ====================

  // ✅ Manager reject/cancel booking
  managerRejectBooking: (bookingId, reason) =>
    axiosInstance.put(`${API}/manager/${bookingId}/reject`, {
      reason,
    }),

  // ✅ Get all bookings (manager/admin view)
  getAllBookings: () => axiosInstance.get(`${API}/manager/all`),

  // ==================== ADMIN ENDPOINTS ====================

  // ✅ Admin view all bookings
  getAllBookingsAdmin: () => axiosInstance.get(`${API}/admin/all`),

  // ==================== GENERAL ENDPOINTS ====================

  // Get booking statistics
  getStatistics: () => axiosInstance.get(`${API}/statistics`),

  // Get available slots
  getAvailableSlots: (vehicleId, date) =>
    axiosInstance.get(`${API}/slots/available`, {
      params: { vehicleId, date },
    }),

  // Get booking calendar
  getBookingCalendar: (vehicleId, startDate, endDate) =>
    axiosInstance.get(`${API}/calendar`, {
      params: { vehicleId, startDate, endDate },
    }),

  // ==================== AI RECOMMENDATIONS ENDPOINTS ====================

  // ✅ NEW: Get vehicle recommendations (calls ML service)
  getVehicleRecommendations: (filters) => {
    console.log("🤖 Calling vehicle recommendations with filters:", filters);

    return axiosInstance
      .post(`/recommendations/vehicles`, filters)
      .then((response) => {
        console.log("✅ Vehicle recommendations response:", response);
        return response;
      })
      .catch((error) => {
        console.error("❌ Vehicle recommendations error:", error);
        throw error;
      });
  },

  // ✅ NEW: Get AI recommendations (booking recommendations)
  getRecommendations: (customerId, vehicleType, isEv, start, end, limit = 5) =>
    axiosInstance.get(`${API}/recommendations`, {
      params: {
        customerId,
        vehicleType,
        isEv,
        start,
        end,
        limit,
      },
    }),

  // ==================== ROUTE ENDPOINTS ====================

  // Get driver's active routes
  getDriverActiveRoutes: async (driverId) => {
    try {
      const response = await axiosInstance.get(
        `/routes/driver/${driverId}/active`
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching active routes:", error);
      throw error;
    }
  },

  // Get route details
  getRouteDetails: async (routeId) => {
    try {
      const response = await axiosInstance.get(`/routes/${routeId}/details`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching route details:", error);
      throw error;
    }
  },

  // Create route from booking
  createRouteFromBooking: async (bookingId, driverId, vehicleId) => {
    try {
      const response = await axiosInstance.post(
        `/routes/from-booking/${bookingId}`,
        null,
        {
          params: { driverId, vehicleId },
        }
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error creating route:", error);
      throw error;
    }
  },

  // Start route
  startRoute: async (routeId) => {
    try {
      const response = await axiosInstance.put(`/routes/${routeId}/start`);
      return response.data;
    } catch (error) {
      console.error("❌ Error starting route:", error);
      throw error;
    }
  },

  // Complete route
  completeRoute: async (routeId) => {
    try {
      const response = await axiosInstance.put(`/routes/${routeId}/complete`);
      return response.data;
    } catch (error) {
      console.error("❌ Error completing route:", error);
      throw error;
    }
  },

  // ==================== MAINTENANCE ENDPOINTS ====================

  // ✅ NEW: Check vehicle maintenance
  checkVehicleMaintenance: async (vehicleId) => {
    try {
      console.log("🔧 Checking maintenance for vehicle:", vehicleId);
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/check/${vehicleId}`
      );
      console.log("✅ Maintenance check response:", response);
      return response;
    } catch (error) {
      console.error("❌ Error checking maintenance:", error);
      throw error;
    }
  },

  // ✅ NEW: Get fleet maintenance analytics
  getFleetMaintenanceAnalytics: async () => {
    try {
      console.log("📊 Fetching fleet maintenance analytics");
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/fleet-analytics`
      );
      console.log("✅ Fleet analytics response:", response);
      return response;
    } catch (error) {
      console.error("❌ Error fetching fleet analytics:", error);
      throw error;
    }
  },

  // ✅ NEW: Get critical vehicles
  getCriticalVehicles: async () => {
    try {
      console.log("🔴 Fetching critical vehicles");
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/critical-vehicles`
      );
      console.log("✅ Critical vehicles response:", response);
      return response;
    } catch (error) {
      console.error("❌ Error fetching critical vehicles:", error);
      throw error;
    }
  },

  // ✅ NEW: Test ML service connection (for debugging)
  testMLServiceConnection: async () => {
    try {
      console.log("🧪 Testing ML service connection");
      const response = await axiosInstance.get(
        `${API_MAINTENANCE}/test-ml-service`
      );
      console.log("✅ ML service test response:", response);
      return response;
    } catch (error) {
      console.error("❌ Error testing ML service:", error);
      throw error;
    }
  },

  // ==================== Live trip tracker ====================

  // ✅ NEW: Get AI-predicted ETA for live tracking
  getAIPredictedETA: async (routeData) => {
    try {
      console.log("🤖 Calling AI ETA prediction:", routeData);

      const response = await axios.post(
        "http://localhost:5001/api/live-tracking/predict-eta",
        {
          distanceKm: routeData.distanceKm,
          avgSpeed: routeData.avgSpeed || 50,
          trafficLevel: routeData.trafficLevel || 0.5,
          batteryLevel: routeData.batteryLevel || 80,
          fuelLevel: routeData.fuelLevel || 75,
        }
      );

      console.log("✅ AI ETA prediction response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ AI ETA prediction error:", error);

      // Fallback
      const fallbackEta =
        (routeData.distanceKm / (routeData.avgSpeed || 50)) * 60;
      return {
        data: {
          predicted_eta: Math.round(fallbackEta),
          model_used: "error_fallback",
          confidence: 0.6,
        },
        status: "fallback",
      };
    }
  },

  // ✅ NEW: Get AI-predicted ETA with vehicle location data
  getAIPredictedETAWithVehicle: async (vehicleId, routeData) => {
    try {
      console.log(
        "🤖 Calling AI ETA prediction with vehicle data:",
        vehicleId,
        routeData
      );

      const response = await axiosInstance.post(
        `/vehicles/${vehicleId}/predict-eta`,
        routeData
      );

      console.log(
        "✅ AI ETA prediction (with vehicle) response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("❌ AI ETA prediction (with vehicle) error:", error);

      // Fallback
      const fallbackEta = (routeData.distanceKm / 50) * 60;
      return {
        vehicleLocation: null,
        aiPrediction: {
          data: {
            predicted_eta: Math.round(fallbackEta),
            model_used: "error_fallback",
            confidence: 0.6,
          },
          status: "fallback",
        },
      };
    }
  },

  // ✅ NEW: Get full optimized route with vehicle location
  getOptimizedRouteWithAI: async (
    vehicleId,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng
  ) => {
    try {
      const response = await axiosInstance.get(
        `/vehicles/${vehicleId}/optimized-route`,
        {
          params: { pickupLat, pickupLng, dropoffLat, dropoffLng },
        }
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error getting optimized route:", error);
      throw error;
    }
  },

  // Get real route from backend proxy
  getRealRoute: async (startLat, startLng, endLat, endLng) => {
    try {
      const response = await axiosInstance.get("/routes/real-route", {
        params: { startLat, startLng, endLat, endLng },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching real route:", error);
      throw error;
    }
  },

  // Get vehicle's live location
  // In bookingApi.js
  getVehicleLiveLocation: (vehicleId) => {
    console.log("📍 API Call: Fetching live location for vehicle:", vehicleId);

    return axiosInstance
      .get(`/vehicles/${vehicleId}/location`)
      .then((response) => {
        console.log("✅ API Response received:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("❌ API Error:", error.response?.data || error.message);
        throw error;
      });
  },

  // Predict route with AI/ML ETA
  // Predict route with AI/ML ETA (via Spring Boot backend)
  predictRoute: async (routeData) => {
    console.log("🤖 Predicting route with AI:", routeData);

    try {
      // ✅ Call Spring Boot backend, which proxies to ML service
      const response = await axiosInstance.post("/routes/predict-eta", {
        distanceKm: calculateDistance(
          routeData.startLat,
          routeData.startLng,
          routeData.endLat,
          routeData.endLng
        ),
        avgSpeed: 50,
        trafficLevel: routeData.trafficLevel || 0.5,
        batteryLevel: 80,
        fuelLevel: 75,
      });

      console.log("✅ ML prediction response:", response.data);

      return {
        data: {
          predicted_eta:
            response.data.predicted_eta || response.data.data.predicted_eta,
          route: generateRoutePoints(
            routeData.startLat,
            routeData.startLng,
            routeData.endLat,
            routeData.endLng
          ),
        },
      };
    } catch (error) {
      console.error("❌ Error predicting route:", error);

      // Fallback calculation
      const distance = calculateDistance(
        routeData.startLat,
        routeData.startLng,
        routeData.endLat,
        routeData.endLng
      );

      const dummyEta = (distance / 50) * 60;

      return {
        data: {
          predicted_eta: dummyEta,
          route: generateRoutePoints(
            routeData.startLat,
            routeData.startLng,
            routeData.endLat,
            routeData.endLng
          ),
        },
      };
    }
  },
};

// Helper: Calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Generate route points for visualization
function generateRoutePoints(lat1, lon1, lat2, lon2) {
  const points = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    points.push([lat1 + (lat2 - lat1) * ratio, lon1 + (lon2 - lon1) * ratio]);
  }
  return points;
}

export default bookingApi;
