import React from "react";
import { motion } from "framer-motion";

const ETADisplay = ({ route }) => {
  if (!route) {
    return null;
  }

  const eta = route.eta_minutes;
  const hours = Math.floor(eta / 60);
  const minutes = Math.round(eta % 60);
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8 text-center"
    >
      <h3 className="text-white/60 text-sm font-semibold mb-2">
        ESTIMATED TIME
      </h3>

      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2"
      >
        {timeString}
      </motion.div>

      <p className="text-white/60 text-sm mb-6">
        {route.name} • {route.distance_km} km
      </p>

      {/* Details */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
        <div>
          <p className="text-white/60 text-xs mb-1">Distance</p>
          <p className="text-lg font-bold text-white">{route.distance_km} km</p>
        </div>
        <div>
          <p className="text-white/60 text-xs mb-1">Traffic</p>
          <p className="text-lg font-bold text-white">
            {getTrafficLabel(route.traffic_level)}
          </p>
        </div>
        <div>
          <p className="text-white/60 text-xs mb-1">Route Type</p>
          <p className="text-lg font-bold text-white">{route.name}</p>
        </div>
      </div>

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
      >
        <p className="text-blue-400 text-sm font-semibold">
          💡 {getRecommendation(route)}
        </p>
      </motion.div>
    </motion.div>
  );
};

const getTrafficLabel = (level) => {
  if (level <= 0.3) return "Light Traffic 🟢";
  if (level <= 0.6) return "Moderate Traffic 🟡";
  return "Heavy Traffic 🔴";
};

const getRecommendation = (route) => {
  const recommendations = {
    Fastest: "This is the fastest route. Ideal if you're in a hurry!",
    Balanced: "Good balance between speed and comfort. Recommended choice.",
    "Avoid Traffic":
      "Takes longer but avoids congested areas. Best for a relaxed drive.",
  };
  return recommendations[route.name] || "Follow this route for optimal travel.";
};

export default ETADisplay;
