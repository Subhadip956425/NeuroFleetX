import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FleetHealthOverview from "./FleetHealthOverview";
import CriticalVehiclesAlert from "./CriticalVehiclesAlert";
import MaintenancePredictionChart from "./MaintenancePredictionChart";
import VehicleHealthScore from "./VehicleHealthScore";
import MaintenanceTimeline from "./MaintenanceTimeline";
import maintenanceApi from "../../api/maintenanceApi";

const MaintenanceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [fleetAnalytics, setFleetAnalytics] = useState(null);
  const [criticalVehicles, setCriticalVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleHealth, setVehicleHealth] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadAnalytics();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      if (autoRefresh) loadAnalytics();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch fleet analytics
      const analyticsResponse =
        await maintenanceApi.getFleetMaintenanceAnalytics();
      setFleetAnalytics(analyticsResponse.data);

      // Fetch critical vehicles
      const criticalResponse = await maintenanceApi.getCriticalVehicles();
      setCriticalVehicles(criticalResponse.data || []);

      console.log("✅ Maintenance analytics loaded");
    } catch (error) {
      console.error("❌ Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = async (vehicleId) => {
    try {
      const response = await maintenanceApi.checkVehicleHealth(vehicleId);
      setVehicleHealth(response.data);
      setSelectedVehicle(vehicleId);
    } catch (error) {
      console.error("❌ Error loading vehicle health:", error);
    }
  };

  const getHealthPercentage = () => {
    if (!fleetAnalytics) return 0;
    const total = fleetAnalytics.total_vehicles || 1;
    return Math.round((fleetAnalytics.healthy / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
                🔧 Maintenance Analytics
              </h1>
              <p className="text-white/60">
                AI-powered predictive maintenance for your entire fleet
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadAnalytics}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50"
            >
              {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
            </motion.button>
          </div>

          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-white/60 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-refresh every 5 minutes
          </label>
        </motion.div>

        {loading && !fleetAnalytics ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Fleet Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FleetHealthOverview analytics={fleetAnalytics} />
            </motion.div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Left Column: Critical Vehicles & Charts */}
              <div className="lg:col-span-2 space-y-6">
                {/* Critical Vehicles */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CriticalVehiclesAlert
                    vehicles={criticalVehicles}
                    onVehicleClick={handleVehicleSelect}
                  />
                </motion.div>

                {/* Maintenance Prediction Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <MaintenancePredictionChart analytics={fleetAnalytics} />
                </motion.div>
              </div>

              {/* Right Column: Vehicle Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                {selectedVehicle && vehicleHealth ? (
                  <>
                    <VehicleHealthScore health={vehicleHealth} />
                    <MaintenanceTimeline health={vehicleHealth} />
                  </>
                ) : (
                  <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-white/60">
                      Select a vehicle to view detailed health information
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <motion.div
    className="flex justify-center items-center h-96"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-6xl mb-4"
      >
        ⚙️
      </motion.div>
      <p className="text-white/60">Loading analytics...</p>
    </div>
  </motion.div>
);

export default MaintenanceAnalytics;
