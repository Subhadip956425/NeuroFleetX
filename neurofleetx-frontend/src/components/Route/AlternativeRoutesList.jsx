import React from "react";
import { motion } from "framer-motion";

const AlternativeRoutesList = ({ routes, selectedRoute, onSelectRoute }) => {
  if (!routes || routes.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-lg font-bold text-white mb-4">
        🛣️ Alternative Routes
      </h3>

      <div className="space-y-3">
        {routes.map((route, index) => {
          const isSelected = selectedRoute?.name === route.name;

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRoute(route)}
              className={`w-full text-left p-4 rounded-xl transition-all border ${
                isSelected
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50"
                  : "bg-white/5 border-white/10 hover:border-white/30"
              }`}
            >
              {/* Route Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getRouteIcon(route.name)}</span>
                  <div>
                    <h4 className="font-bold text-white">{route.name}</h4>
                    <p className="text-white/60 text-xs">
                      {route.description || "Optimal route"}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-2xl"
                  >
                    ✓
                  </motion.div>
                )}
              </div>

              {/* Route Details */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">ETA:</span>
                  <span className="text-white font-semibold">
                    {route.eta_minutes.toFixed(0)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Distance:</span>
                  <span className="text-white font-semibold">
                    {route.distance_km} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Traffic:</span>
                  <span className={getTrafficColor(route.traffic_level)}>
                    {getTrafficLabel(route.traffic_level)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Path:</span>
                  <span
                    className={`inline-block w-3 h-3 rounded-full`}
                    style={{ backgroundColor: route.color }}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

const getRouteIcon = (name) => {
  const icons = {
    Fastest: "⚡",
    Balanced: "⚖️",
    "Avoid Traffic": "🛑",
  };
  return icons[name] || "🛣️";
};

const getTrafficColor = (level) => {
  if (level <= 0.3) return "text-green-400";
  if (level <= 0.6) return "text-yellow-400";
  return "text-red-400";
};

const getTrafficLabel = (level) => {
  if (level <= 0.3) return "Light 🟢";
  if (level <= 0.6) return "Moderate 🟡";
  return "Heavy 🔴";
};

export default AlternativeRoutesList;
