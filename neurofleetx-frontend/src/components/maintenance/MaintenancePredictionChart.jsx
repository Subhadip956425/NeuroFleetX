import React from "react";
import { motion } from "framer-motion";

const MaintenancePredictionChart = ({ analytics }) => {
  // ✅ Add null safety checks
  if (!analytics) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-white/60 text-center">No data available</p>
      </div>
    );
  }

  const total = analytics.total_vehicles || 1;
  const healthy = analytics.healthy || 0;
  const due = analytics.due || analytics.needs_maintenance || 0; // ✅ Fallback to needs_maintenance
  const critical = analytics.critical || 0;

  // ✅ Prevent division by zero
  const healthyPercent = total > 0 ? (healthy / total) * 100 : 0;
  const duePercent = total > 0 ? (due / total) * 100 : 0;
  const criticalPercent = total > 0 ? (critical / total) * 100 : 0;

  const chartData = [
    {
      label: "Healthy",
      value: healthyPercent,
      count: healthy,
      color: "from-green-500 to-emerald-600",
      icon: "✅",
    },
    {
      label: "Due",
      value: duePercent,
      count: due,
      color: "from-yellow-500 to-orange-600",
      icon: "⏰",
    },
    {
      label: "Critical",
      value: criticalPercent,
      count: critical,
      color: "from-red-500 to-pink-600",
      icon: "🚨",
    },
  ];

  // ✅ Filter out zero values to avoid rendering issues
  const validChartData = chartData.filter((item) => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-6">
        📊 Fleet Status Distribution
      </h3>

      {/* Pie Chart Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="flex justify-center items-center">
          {validChartData.length > 0 ? (
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Background Circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#ffffff10"
                strokeWidth="40"
              />
              {/* Pie segments */}
              {validChartData.map((item, index) => {
                const startAngle = validChartData
                  .slice(0, index)
                  .reduce((sum, d) => sum + (d.value / 100) * 360, 0);
                const endAngle = startAngle + (item.value / 100) * 360;

                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);

                const x1 = 100 + 90 * Math.cos(startRad);
                const y1 = 100 + 90 * Math.sin(startRad);
                const x2 = 100 + 90 * Math.cos(endRad);
                const y2 = 100 + 90 * Math.sin(endRad);

                const largeArc = item.value > 50 ? 1 : 0;

                const colorMap = {
                  "from-green-500 to-emerald-600": "#10b981",
                  "from-yellow-500 to-orange-600": "#f59e0b",
                  "from-red-500 to-pink-600": "#ef4444",
                };

                // ✅ Validate coordinates before rendering
                if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
                  console.warn("Invalid coordinates for", item.label);
                  return null;
                }

                return (
                  <motion.path
                    key={item.label}
                    d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colorMap[item.color]}
                    fillOpacity="0.7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="text-center text-white/60">
              <p>No data to display</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col justify-center space-y-4">
          {chartData.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-r ${item.color}`}
              />
              <div className="flex-1">
                <p className="text-white font-semibold">
                  {item.label} ({item.count})
                </p>
                <p className="text-white/60 text-sm">
                  {Math.round(item.value)}%
                </p>
              </div>
              <div className="text-2xl">{item.icon}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MaintenancePredictionChart;
