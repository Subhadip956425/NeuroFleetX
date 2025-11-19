import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const CriticalVehiclesAlert = ({ vehicles, onVehicleClick }) => {
  if (!vehicles || vehicles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 text-center"
      >
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-xl font-bold text-green-400">
          All Systems Operational
        </h3>
        <p className="text-white/60 mt-2">
          No critical maintenance issues detected
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🚨</span>
        Critical Maintenance Required
      </h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {vehicles.map((vehicle, index) => (
            <motion.button
              key={vehicle.vehicleId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 5 }}
              onClick={() => onVehicleClick(vehicle.vehicleId)}
              className="w-full text-left backdrop-blur-sm bg-red-500/10 border border-red-500/30 rounded-xl p-4 hover:bg-red-500/20 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Vehicle #{vehicle.vehicleId}
                  </h4>
                  <p className="text-red-400 text-sm">{vehicle.status}</p>
                </div>
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-white/70 text-sm mb-2">{vehicle.vehicleId}</p>
              <div className="flex justify-between text-xs text-white/60">
                <span>⏰ Days until: {vehicle.daysUntilMaintenance}</span>
                <span className="text-red-400">ACTION NEEDED</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CriticalVehiclesAlert;
