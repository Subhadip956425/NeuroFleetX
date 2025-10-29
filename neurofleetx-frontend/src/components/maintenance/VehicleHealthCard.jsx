import React from "react";
import { motion } from "framer-motion";

const VehicleHealthCard = ({ vehicle }) => {
  // Calculate overall health score
  const calculateHealthScore = () => {
    const batteryHealth = vehicle.batteryLevel || 100;
    const fuelHealth = vehicle.fuelLevel || 100;
    const tireHealth = 100 - (vehicle.tireWear || 0);
    const engineHealth = vehicle.engineHealth || 100;

    return Math.round(
      (batteryHealth + fuelHealth + tireHealth + engineHealth) / 4
    );
  };

  const healthScore = calculateHealthScore();

  // Determine overall status
  const getStatus = () => {
    if (healthScore >= 80) return { label: "Excellent", color: "green" };
    if (healthScore >= 60) return { label: "Good", color: "blue" };
    if (healthScore >= 40) return { label: "Fair", color: "yellow" };
    if (healthScore >= 20) return { label: "Poor", color: "orange" };
    return { label: "Critical", color: "red" };
  };

  const status = getStatus();

  // Health metrics configuration
  const metrics = [
    {
      label: "Battery",
      value: vehicle.batteryLevel || 0,
      icon: "🔋",
      color:
        vehicle.batteryLevel >= 60
          ? "#10b981"
          : vehicle.batteryLevel >= 30
          ? "#f59e0b"
          : "#ef4444",
    },
    {
      label: "Fuel",
      value: vehicle.fuelLevel || 0,
      icon: "⛽",
      color:
        vehicle.fuelLevel >= 60
          ? "#10b981"
          : vehicle.fuelLevel >= 30
          ? "#f59e0b"
          : "#ef4444",
    },
    {
      label: "Tire Health",
      value: 100 - (vehicle.tireWear || 0),
      icon: "🛞",
      color:
        vehicle.tireWear <= 40
          ? "#10b981"
          : vehicle.tireWear <= 70
          ? "#f59e0b"
          : "#ef4444",
    },
    {
      label: "Engine",
      value: vehicle.engineHealth || 100,
      icon: "🔧",
      color:
        vehicle.engineHealth >= 80
          ? "#10b981"
          : vehicle.engineHealth >= 50
          ? "#f59e0b"
          : "#ef4444",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all relative overflow-hidden group"
    >
      {/* Background Gradient Effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${
            status.color === "green"
              ? "rgba(16, 185, 129, 0.1)"
              : status.color === "red"
              ? "rgba(239, 68, 68, 0.1)"
              : "rgba(245, 158, 11, 0.1)"
          } 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            🚗 {vehicle.name || `Vehicle #${vehicle.id}`}
          </h3>
          <p className="text-white/60 text-xs">
            Mileage: {vehicle.mileage?.toLocaleString() || "N/A"} km
          </p>
        </div>

        {/* Health Score Badge */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg ${
            status.color === "green"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : status.color === "blue"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : status.color === "yellow"
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : status.color === "orange"
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {healthScore}%
        </motion.div>
      </div>

      {/* Status Indicator */}
      <div className="relative z-10 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${
              status.color === "green"
                ? "bg-green-400"
                : status.color === "blue"
                ? "bg-blue-400"
                : status.color === "yellow"
                ? "bg-yellow-400"
                : status.color === "orange"
                ? "bg-orange-400"
                : "bg-red-400"
            } animate-pulse`}
          />
          <span className="text-white/80 text-sm font-semibold">
            {status.label}
          </span>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="relative z-10 space-y-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/60 text-xs flex items-center gap-1">
                <span>{metric.icon}</span>
                {metric.label}
              </span>
              <span className="text-white font-semibold text-sm">
                {Math.round(metric.value)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{
                  duration: 1,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: metric.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="text-xs text-white/40">
          Last Service: {vehicle.lastMaintenanceDate || "Never"}
        </div>

        {/* Action Button */}
        {healthScore < 60 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Schedule Service
          </motion.button>
        )}
      </div>

      {/* Critical Alert Badge */}
      {healthScore < 40 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 z-20"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-pulse" />
            <div className="relative bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              ⚠️ Alert
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VehicleHealthCard;
