import React from "react";
import { motion } from "framer-motion";

const MaintenanceTimeline = ({ health }) => {
  if (!health) return null;

  const getMetrics = () => {
    return [
      { label: "Status", value: health.status, icon: "📊", color: "blue" },
      {
        label: "Health Score",
        value: `${health.health_score.toFixed(0)}/100`,
        icon: "💪",
        color: "green",
      },
      {
        label: "Days Until",
        value: `${health.days_until_maintenance} days`,
        icon: "⏰",
        color: "yellow",
      },
      {
        label: "Confidence",
        value: `${(health.confidence || 0).toFixed(1)}%`,
        icon: "🎯",
        color: "purple",
      },
    ];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-lg font-bold text-white mb-4">📈 Metrics</h3>

      <div className="space-y-3">
        {getMetrics().map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{metric.icon}</span>
              <span className="text-white/70 text-sm">{metric.label}</span>
            </div>
            <span className="text-white font-bold">{metric.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"
      >
        <p className="text-blue-400 text-sm font-semibold">
          💡 Schedule maintenance within {health.days_until_maintenance} days to
          prevent service disruption
        </p>
      </motion.div>
    </motion.div>
  );
};

export default MaintenanceTimeline;
