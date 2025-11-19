import React from "react";
import { motion } from "framer-motion";

const VehicleHealthScore = ({ health }) => {
  if (!health) return null;

  const score = health.health_score || 0;
  const status = health.status || "Unknown";
  const nextMaintenance = health.next_maintenance_date || "N/A";
  const daysUntil = health.days_until_maintenance || 0;

  const getStatusColor = () => {
    switch (status) {
      case "Healthy":
        return "from-green-500 to-emerald-600";
      case "Due":
        return "from-yellow-500 to-orange-600";
      case "Critical":
        return "from-red-500 to-pink-600";
      default:
        return "from-blue-500 to-cyan-600";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "Healthy":
        return "✅";
      case "Due":
        return "⏰";
      case "Critical":
        return "🚨";
      default:
        return "❓";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-lg font-bold text-white mb-4">💪 Health Score</h3>

      {/* Score Display */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#ffffff10"
            strokeWidth="8"
          />

          {/* Progress */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeDasharray={`${score * 2.827} 282.7`}
            initial={{ strokeDasharray: "0 282.7" }}
            animate={{ strokeDasharray: `${score * 2.827} 282.7` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />

          {/* Gradient */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Text */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-3xl font-black text-cyan-400">
            {score.toFixed(0)}
          </span>
          <span className="text-xs text-white/60">/100</span>
        </motion.div>
      </div>

      {/* Status */}
      <div
        className={`bg-gradient-to-r ${getStatusColor()} bg-opacity-10 border border-opacity-30 rounded-xl p-4 text-center mb-4`}
      >
        <div className="text-3xl mb-2">{getStatusIcon()}</div>
        <p className="text-white font-bold">{status}</p>
      </div>

      {/* Timeline */}
      <div className="bg-white/5 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Next Maintenance:</span>
          <span className="text-white font-semibold">{nextMaintenance}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Days Until:</span>
          <span
            className={`font-semibold ${
              daysUntil <= 7 ? "text-red-400" : "text-green-400"
            }`}
          >
            {daysUntil} days
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Confidence:</span>
          <span className="text-white font-semibold">
            {(health.confidence || 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default VehicleHealthScore;
