import axiosInstance from "./axiosInstance";

const API = "/routes";

const routeApi = {
  // ✅ ADD THIS FUNCTION
  getDriverRoutes: (driverId) => axiosInstance.get(`${API}/driver/${driverId}`),

  // Predict ETA for a route
  predictETA: (params) => axiosInstance.post(`${API}/predict-eta`, params),

  // Optimize route for a vehicle
  optimizeRoute: (vehicleId, distance, speed, traffic, pickup, dropoff) =>
    axiosInstance.post(`${API}/optimize`, null, {
      params: {
        vehicleId,
        distanceKm: distance,
        avgSpeed: speed,
        trafficLevel: traffic,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
      },
    }),

  // Compare multiple routes
  compareRoutes: (vehicleId, pickup, dropoff) =>
    axiosInstance.get(`${API}/compare/${vehicleId}`, {
      params: { pickup, dropoff },
    }),

  // ==================== LIVE VEHICLE TRACKING ====================

  /**
   * ✅ NEW: Get vehicle's live GPS location
   * Returns real-time coordinates, speed, battery, fuel levels
   */
  getVehicleLiveLocation: (vehicleId) => {
    console.log("📍 routeApi: Fetching live location for vehicle:", vehicleId);

    return axiosInstance
      .get(`/vehicles/${vehicleId}/location`)
      .then((response) => {
        console.log("✅ routeApi: Live location received:", response.data);
        return response;
      })
      .catch((error) => {
        console.error(
          "❌ routeApi: Error fetching live location:",
          error.response?.data || error.message
        );
        throw error;
      });
  },

  /**
   * ✅ NEW: Get real road-based route between two points
   * Uses OSRM routing service via backend proxy
   */
  getRealRoute: async (startLat, startLng, endLat, endLng) => {
    try {
      console.log(
        `🗺️ routeApi: Fetching real route from [${startLat}, ${startLng}] to [${endLat}, ${endLng}]`
      );

      const response = await axiosInstance.get("/routes/real-route", {
        params: { startLat, startLng, endLat, endLng },
      });

      console.log("✅ routeApi: Real route received:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ routeApi: Error fetching real route:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * ✅ NEW: Get AI-predicted ETA using ML model
   * Calls Flask ML service via Spring Boot backend
   */
  getAIPredictedETA: async (routeData) => {
    try {
      console.log("🤖 routeApi: Calling AI ETA prediction:", routeData);

      const response = await axiosInstance.post(
        "https://neurofleetx-ml-latest.onrender.com/api/live-tracking/predict-eta",
        {
          distanceKm: routeData.distanceKm,
          avgSpeed: routeData.avgSpeed || 50,
          trafficLevel: routeData.trafficLevel || 0.5,
          batteryLevel: routeData.batteryLevel || 80,
          fuelLevel: routeData.fuelLevel || 75,
        }
      );

      console.log("✅ routeApi: AI ETA prediction received:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ routeApi: AI ETA prediction error:",
        error.response?.data || error.message
      );

      // Fallback calculation
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

  /**
   * ✅ NEW: Get complete optimized route with vehicle location and AI predictions
   * Combines vehicle tracking + route optimization + ML predictions
   */
  getOptimizedLiveRoute: async (
    vehicleId,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng
  ) => {
    try {
      console.log(
        `🚀 routeApi: Getting optimized live route for vehicle ${vehicleId}`
      );

      // Step 1: Get vehicle's current location
      const vehicleLocationResponse = await routeApi.getVehicleLiveLocation(
        vehicleId
      );
      const vehicleLocation = vehicleLocationResponse.data;

      console.log("📍 Vehicle current location:", vehicleLocation);

      // Step 2: Get real routes
      const [route1Data, route2Data] = await Promise.all([
        routeApi.getRealRoute(
          vehicleLocation.latitude,
          vehicleLocation.longitude,
          pickupLat,
          pickupLng
        ),
        routeApi.getRealRoute(pickupLat, pickupLng, dropoffLat, dropoffLng),
      ]);

      console.log("🗺️ Routes fetched:", {
        segment1: route1Data.routes[0]?.distance,
        segment2: route2Data.routes[0]?.distance,
      });

      // Step 3: Get AI predictions for both segments
      const distanceKm1 = (route1Data.routes[0]?.distance || 0) / 1000;
      const distanceKm2 = (route2Data.routes[0]?.distance || 0) / 1000;

      const [eta1Response, eta2Response] = await Promise.all([
        routeApi.getAIPredictedETA({
          distanceKm: distanceKm1,
          avgSpeed: vehicleLocation.speed || 50,
          trafficLevel: 0.5,
          batteryLevel: vehicleLocation.batteryLevel || 80,
          fuelLevel: vehicleLocation.fuelLevel || 75,
        }),
        routeApi.getAIPredictedETA({
          distanceKm: distanceKm2,
          avgSpeed: 50,
          trafficLevel: 0.5,
          batteryLevel: vehicleLocation.batteryLevel || 80,
          fuelLevel: vehicleLocation.fuelLevel || 75,
        }),
      ]);

      console.log("🤖 AI predictions received");

      // Step 4: Combine all data
      return {
        vehicleLocation: {
          vehicleId: vehicleLocation.vehicleId,
          latitude: vehicleLocation.latitude,
          longitude: vehicleLocation.longitude,
          speed: vehicleLocation.speed,
          heading: vehicleLocation.heading,
          batteryLevel: vehicleLocation.batteryLevel,
          fuelLevel: vehicleLocation.fuelLevel,
          timestamp: vehicleLocation.timestamp,
        },
        segment1: {
          from: "Vehicle",
          to: "Pickup",
          route: route1Data.routes[0].geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]),
          distanceKm: distanceKm1,
          durationMinutes: Math.round(route1Data.routes[0].duration / 60),
          aiPrediction: eta1Response,
        },
        segment2: {
          from: "Pickup",
          to: "Dropoff",
          route: route2Data.routes[0].geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]),
          distanceKm: distanceKm2,
          durationMinutes: Math.round(route2Data.routes[0].duration / 60),
          aiPrediction: eta2Response,
        },
        totalDistance: distanceKm1 + distanceKm2,
        totalETA:
          (eta1Response.data?.predicted_eta || 0) +
          (eta2Response.data?.predicted_eta || 0),
      };
    } catch (error) {
      console.error("❌ routeApi: Error getting optimized live route:", error);
      throw error;
    }
  },

  /**
   * ✅ NEW: Track vehicle movement in real-time
   * Sets up periodic location updates
   */
  startVehicleTracking: (vehicleId, updateInterval = 15000, callback) => {
    console.log(
      `🔄 Starting vehicle tracking for vehicle ${vehicleId} (interval: ${updateInterval}ms)`
    );

    // Initial fetch
    routeApi
      .getVehicleLiveLocation(vehicleId)
      .then((response) => callback(response.data))
      .catch((error) => console.error("❌ Initial tracking error:", error));

    // Set up periodic updates
    const trackingInterval = setInterval(() => {
      routeApi
        .getVehicleLiveLocation(vehicleId)
        .then((response) => {
          console.log("🔄 Vehicle location updated:", response.data);
          callback(response.data);
        })
        .catch((error) => {
          console.error("❌ Tracking update error:", error);
        });
    }, updateInterval);

    // Return cleanup function
    return () => {
      console.log(`🛑 Stopping vehicle tracking for vehicle ${vehicleId}`);
      clearInterval(trackingInterval);
    };
  },
};

export default routeApi;
