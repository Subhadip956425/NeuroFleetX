import React from "react";
import { motion } from "framer-motion";

const VehicleRecommendations = ({ vehicles, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-white text-xl">⏳ Loading recommendations...</div>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl"
      >
        <div className="text-6xl mb-4">🚗</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          No vehicles available
        </h3>
        <p className="text-white/60">Try adjusting your search criteria</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          🤖 AI-Recommended Vehicles
        </h2>
        <p className="text-white/60 mt-1">
          Based on your preferences • {vehicles.length} options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.vehicle_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            onClick={() => onSelect(vehicle)}
            className="cursor-pointer backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all relative overflow-hidden group"
          >
            {/* AI Badge */}
            {vehicle.is_ai_recommended && (
              <motion.div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-xs font-bold text-white">
                🤖 AI Pick
              </motion.div>
            )}

            {/* Confidence Score */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-white">
                  Vehicle #{vehicle.vehicle_id}
                </h3>
                <span className="text-sm font-semibold text-cyan-400">
                  {vehicle.confidence_score.toFixed(1)}% match
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${vehicle.confidence_score}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-2 mb-4">
              <p className="text-white/80">
                <span className="font-semibold">Type:</span>{" "}
                {vehicle.type || "Standard"}
              </p>
              <p className="text-white/80">
                <span className="font-semibold">Seats:</span>{" "}
                {vehicle.seats || "4"}
              </p>
              <p className="text-white/80">
                <span className="font-semibold">Battery:</span>{" "}
                {vehicle.batteryLevel || 85}%
              </p>
            </div>

            {/* Select Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl transition-all"
            >
              ✓ Select Vehicle
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default VehicleRecommendations;
