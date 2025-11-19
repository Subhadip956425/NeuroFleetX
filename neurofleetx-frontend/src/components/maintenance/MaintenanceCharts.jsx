import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Doughnut } from "react-chartjs-2";

const MaintenanceCharts = ({ stats = {} }) => {
  // ✅ FIX: Provide default values if stats is undefined
  const safeStats = {
    critical: stats?.critical || 0,
    high: stats?.high || 0,
    medium: stats?.medium || 0,
    total: stats?.total || 0,
  };

  // ✅ FIX: Memoize the chart data to prevent infinite re-renders
  const severityData = useMemo(() => {
    return {
      labels: ["Critical", "High", "Medium"],
      datasets: [
        {
          label: "Maintenance Tickets by Severity",
          data: [safeStats.critical, safeStats.high, safeStats.medium],
          backgroundColor: [
            "rgba(239, 68, 68, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(16, 185, 129, 0.8)",
          ],
          borderColor: [
            "rgba(239, 68, 68, 1)",
            "rgba(251, 191, 36, 1)",
            "rgba(16, 185, 129, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [safeStats.critical, safeStats.high, safeStats.medium]);

  // ✅ FIX: Memoize the chart options
  const pieOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "rgba(255, 255, 255, 0.8)",
            font: { size: 12 },
          },
        },
      },
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Severity Distribution */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          Maintenance Severity Distribution
        </h3>
        <div style={{ height: "300px" }}>
          <Doughnut data={severityData} options={pieOptions} />
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6">
          Maintenance Overview
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <span className="text-white/80 font-semibold">Critical Issues</span>
            <span className="text-2xl font-black text-red-400">
              {safeStats.critical}
            </span>
          </div>
          <div className="flex justify-between items-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <span className="text-white/80 font-semibold">High Priority</span>
            <span className="text-2xl font-black text-yellow-400">
              {safeStats.high}
            </span>
          </div>
          <div className="flex justify-between items-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <span className="text-white/80 font-semibold">Medium Priority</span>
            <span className="text-2xl font-black text-green-400">
              {safeStats.medium}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MaintenanceCharts;
