import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import maintenanceApi from "../../api/maintenanceApi";

const PredictiveMaintenancePanel = ({ vehicleId }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (vehicleId) {
      loadPrediction();
    }
  }, [vehicleId]);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceApi.getPrediction(vehicleId);
      setPrediction(data);
    } catch (err) {
      console.error("Error loading prediction:", err);
      setError("Failed to load prediction");
    } finally {
      setLoading(false);
    }
  };

  const triggerEvaluation = async () => {
    try {
      setLoading(true);
      await maintenanceApi.evaluateVehicleHealth(vehicleId);
      await loadPrediction(); // Reload after evaluation
    } catch (err) {
      console.error("Error evaluating:", err);
      setError("Failed to evaluate vehicle health");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-white/60">Analyzing vehicle health...</p>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-white/60 mb-4">
          {error || "No prediction available"}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={triggerEvaluation}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg"
        >
          🔍 Run Analysis
        </motion.button>
      </div>
    );
  }

  const { data } = prediction;
  const statusColor =
    data.status === "Critical"
      ? "red"
      : data.status === "Due"
      ? "orange"
      : "green";

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              🤖 AI Maintenance Prediction
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  statusColor === "red"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : statusColor === "orange"
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                }`}
              >
                {data.status}
              </span>
            </h2>
            <p className="text-white/60 text-sm mt-2">
              ML Confidence: {data.ml_confidence}% • Health Score:{" "}
              {data.health_score}%
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={triggerEvaluation}
            className="px-4 py-2 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
          >
            🔄 Re-analyze
          </motion.button>
        </div>
      </motion.div>

      {/* Next Maintenance Date */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          📅 Maintenance Schedule
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Next Service Due</p>
            <p className="text-3xl font-black text-cyan-400 mt-1">
              {new Date(data.next_maintenance_date).toLocaleDateString()}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {data.days_until_maintenance} days remaining
            </p>
          </div>
          <div className="text-6xl">
            {data.days_until_maintenance <= 3
              ? "🚨"
              : data.days_until_maintenance <= 14
              ? "⚠️"
              : "✅"}
          </div>
        </div>
      </motion.div>

      {/* Critical Issues */}
      {data.critical_issues && data.critical_issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-3xl p-6"
        >
          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            🚨 Critical Issues ({data.critical_issues.length})
          </h3>
          <div className="space-y-3">
            {data.critical_issues.map((issue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-red-500/20 border border-red-500/40 rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold mb-1">
                      {issue.component}: {issue.issue}
                    </p>
                    <p className="text-red-300 text-sm mb-2">{issue.action}</p>
                    <div className="flex gap-4 text-xs text-white/60">
                      <span>Current: {issue.value}</span>
                      <span>Threshold: {issue.threshold}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                    URGENT
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Warnings */}
      {data.warnings && data.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6"
        >
          <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
            ⚠️ Warnings ({data.warnings.length})
          </h3>
          <div className="space-y-2">
            {data.warnings.map((warning, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-3"
              >
                <p className="text-white font-semibold text-sm">
                  {warning.component}: {warning.issue}
                </p>
                <p className="text-orange-300 text-xs mt-1">{warning.action}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            💡 Recommendations
          </h3>
          <div className="space-y-3">
            {data.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  rec.priority === "URGENT"
                    ? "bg-red-500/10 border-red-500/30"
                    : rec.priority === "HIGH"
                    ? "bg-orange-500/10 border-orange-500/30"
                    : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{rec.icon}</span>
                  <div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        rec.priority === "URGENT"
                          ? "bg-red-500/20 text-red-400"
                          : rec.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <p className="text-white text-sm mt-2">{rec.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          📊 Current Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.metrics || {}).map(([key, value]) => (
            <div key={key} className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-white/60 text-xs mb-1">{key}</p>
              <p className="text-white font-bold text-lg">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PredictiveMaintenancePanel;
