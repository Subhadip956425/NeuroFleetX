import React from "react";
import { motion } from "framer-motion";

const RouteMapView = ({ route, routeData }) => {
  if (!route) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden"
    >
      <h3 className="text-lg font-bold text-white mb-4">📍 Route Preview</h3>

      {/* Map Container */}
      <div className="relative w-full h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-white/10">
        {/* Animated Background */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M0 0L60 60M60 0L0 60" stroke="rgb(6,182,212)" fill="none"/></svg>')`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Route Visualization */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Bezier Curve Route */}
          <defs>
            <linearGradient
              id="routeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>

          {/* Route Path */}
          <motion.path
            d="M 50 80 Q 150 120, 250 100 T 450 50"
            stroke="url(#routeGradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2 }}
          />

          {/* Start Point */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <circle cx="50" cy="80" r="8" fill="#10b981" />
            <circle
              cx="50"
              cy="80"
              r="12"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              opacity="0.5"
            />
          </motion.g>

          {/* End Point */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <circle cx="450" cy="50" r="8" fill="#ef4444" />
            <circle
              cx="450"
              cy="50"
              r="12"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              opacity="0.5"
            />
          </motion.g>

          {/* Moving Vehicle */}
          <motion.g
            animate={{ offsetDistance: "100%" }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <circle cx="50" cy="80" r="5" fill="#fbbf24" />
          </motion.g>
        </svg>

        {/* Markers */}
        <div className="absolute top-4 left-4 text-white/80 text-sm">
          <p className="font-semibold">
            📍 {routeData?.pickupLocation || "Start Point"}
          </p>
        </div>
        <div className="absolute bottom-4 right-4 text-white/80 text-sm text-right">
          <p className="font-semibold">
            🎯 {routeData?.dropoffLocation || "End Point"}
          </p>
        </div>
      </div>

      {/* Route Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-lg p-3 text-center"
        >
          <p className="text-white/60 text-xs">Distance</p>
          <p className="text-xl font-bold text-cyan-400">
            {route.distance_km} km
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 rounded-lg p-3 text-center"
        >
          <p className="text-white/60 text-xs">ETA</p>
          <p className="text-xl font-bold text-cyan-400">
            {route.eta_minutes.toFixed(0)} min
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 rounded-lg p-3 text-center"
        >
          <p className="text-white/60 text-xs">Route</p>
          <p className="text-xl font-bold text-cyan-400">{route.name}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RouteMapView;
