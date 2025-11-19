import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import maintenanceApi from "../../api/maintenanceApi";
import PredictiveMaintenancePanel from "./PredictiveMaintenancePanel";

const AIMaintenanceDashboard = () => {
  const [criticalVehicles, setCriticalVehicles] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    healthy: 0,
    due: 0,
    critical: 0,
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      console.log("🔍 Loading AI maintenance data...");

      // Load all predictions
      const predictions = await maintenanceApi.getAllPredictions();
      console.log("📊 Raw predictions response:", predictions);
      console.log("📊 Predictions count:", predictions?.length || 0);

      setAllPredictions(predictions || []);

      // Load critical vehicles
      const critical = await maintenanceApi.getCriticalVehicles();
      console.log("🚨 Raw critical response:", critical);
      console.log("🚨 Critical count:", critical?.length || 0);

      setCriticalVehicles(critical || []);

      // Calculate stats with better logging
      const healthyCount = (predictions || []).filter(
        (p) => p.reason === "Healthy"
      ).length;
      const dueCount = (predictions || []).filter(
        (p) => p.reason === "Due"
      ).length;
      const criticalCount = (predictions || []).filter(
        (p) => p.reason === "Critical"
      ).length;

      console.log("📈 Calculated stats:", {
        healthy: healthyCount,
        due: dueCount,
        critical: criticalCount,
      });

      const statsData = {
        healthy: healthyCount,
        due: dueCount,
        critical: criticalCount,
      };
      setStats(statsData);
    } catch (error) {
      console.error("❌ Error loading AI maintenance data:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-white/60">Loading AI predictions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              🤖 AI-Powered Predictive Maintenance
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Machine learning predictions • Threshold monitoring • Proactive
              alerts
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadData}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg"
          >
            🔄 Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Healthy",
            value: stats.healthy,
            icon: "✅",
            bg: "from-green-500/20 to-emerald-500/10",
            border: "border-green-500/30",
            text: "text-green-400",
          },
          {
            title: "Service Due",
            value: stats.due,
            icon: "⚠️",
            bg: "from-orange-500/20 to-yellow-500/10",
            border: "border-orange-500/30",
            text: "text-orange-400",
          },
          {
            title: "Critical",
            value: stats.critical,
            icon: "🚨",
            bg: "from-red-500/20 to-pink-500/10",
            border: "border-red-500/30",
            text: "text-red-400",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative group"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.bg} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />
            <div
              className={`relative backdrop-blur-xl bg-white/5 border ${stat.border} rounded-2xl p-6`}
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <h3 className={`text-3xl font-black ${stat.text} mb-1`}>
                {stat.value}
              </h3>
              <p className="text-white/60 text-sm font-semibold">
                {stat.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Critical Alerts */}
      {criticalVehicles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-3xl p-6"
        >
          <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
            🚨 Critical Vehicles ({criticalVehicles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalVehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.vehicleId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 cursor-pointer hover:bg-red-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">
                      Vehicle #{vehicle.vehicleId}
                    </p>
                    <p className="text-red-300 text-sm">{vehicle.message}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                    URGENT
                  </span>
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>⏰ {vehicle.daysUntilMaintenance} days</span>
                  <span>📊 {vehicle.confidence}% confidence</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Predictions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <h3 className="text-2xl font-bold text-white mb-4">
          📊 Fleet Maintenance Predictions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                  Health Score
                </th>
                <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                  Next Service
                </th>
                <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {allPredictions.map((pred, index) => (
                <motion.tr
                  key={pred.vehicleId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-all"
                >
                  <td className="px-4 py-3 text-white font-semibold">
                    Vehicle #{pred.vehicleId}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        pred.status === "Critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : pred.status === "Due"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}
                    >
                      {pred.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            pred.healthScore >= 80
                              ? "bg-green-500"
                              : pred.healthScore >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${pred.healthScore}%` }}
                        />
                      </div>
                      <span className="text-white text-sm font-bold w-12">
                        {pred.healthScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/80 text-sm">
                    {new Date(pred.nextMaintenanceDate).toLocaleDateString()}
                    <span className="text-xs text-white/60 block">
                      ({pred.daysUntilMaintenance} days)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/80 text-sm">
                    {pred.mlConfidence}%
                  </td>
                  <td className="px-4 py-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedVehicleId(pred.vehicleId)}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold hover:bg-blue-500/30 transition-all"
                    >
                      👁️ Details
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedVehicleId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedVehicleId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-gray-900/95 border border-white/20 rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Vehicle #{selectedVehicleId} - AI Analysis
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedVehicleId(null)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  ✕
                </motion.button>
              </div>

              <PredictiveMaintenancePanel vehicleId={selectedVehicleId} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIMaintenanceDashboard;
