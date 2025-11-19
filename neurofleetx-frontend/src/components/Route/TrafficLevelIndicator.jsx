import React from "react";
import { motion } from "framer-motion";

const TrafficLevelIndicator = ({ currentLevel, onChange }) => {
  const levels = [
    { value: 0.2, label: "Low", icon: "🟢", description: "Clear roads" },
    { value: 0.5, label: "Medium", icon: "🟡", description: "Some congestion" },
    { value: 0.8, label: "High", icon: "🔴", description: "Heavy traffic" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-lg font-bold text-white mb-4">🚗 Traffic Level</h3>

      <div className="space-y-3">
        {levels.map((level) => (
          <motion.button
            key={level.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(level.value)}
            className={`w-full text-left p-4 rounded-lg transition-all border ${
              currentLevel === level.value
                ? "bg-cyan-500/20 border-cyan-500/50"
                : "bg-white/5 border-white/10 hover:border-white/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{level.icon}</span>
                <div>
                  <p className="font-bold text-white">{level.label}</p>
                  <p className="text-white/60 text-xs">{level.description}</p>
                </div>
              </div>
              {currentLevel === level.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xl"
                >
                  ✓
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Live Indicator */}
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px rgba(6, 182, 212, 0.2)",
            "0 0 30px rgba(6, 182, 212, 0.4)",
            "0 0 20px rgba(6, 182, 212, 0.2)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-center"
      >
        <p className="text-cyan-400 text-sm font-semibold">
          📡 Live Traffic Data • Last updated: Now
        </p>
      </motion.div>
    </motion.div>
  );
};

export default TrafficLevelIndicator;
