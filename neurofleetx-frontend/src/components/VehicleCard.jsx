import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VehicleCard({ vehicle, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statusConfig =
    vehicle.status === "Available"
      ? {
          color: "from-green-500 to-emerald-500",
          bg: "from-green-500/20 to-emerald-500/10",
          icon: "✅",
          dot: "bg-green-400",
        }
      : vehicle.status === "In Use"
      ? {
          color: "from-yellow-500 to-orange-500",
          bg: "from-yellow-500/20 to-orange-500/10",
          icon: "🚦",
          dot: "bg-yellow-400",
        }
      : {
          color: "from-red-500 to-pink-500",
          bg: "from-red-500/20 to-pink-500/10",
          icon: "🔧",
          dot: "bg-red-400",
        };

  // Vehicle Type Configuration
  const typeConfig = {
    Car: {
      icon: "🚗",
      bg: "from-blue-500/20 to-cyan-500/10",
      text: "text-blue-400",
    },
    Van: {
      icon: "🚐",
      bg: "from-purple-500/20 to-pink-500/10",
      text: "text-purple-400",
    },
    Truck: {
      icon: "🚚",
      bg: "from-orange-500/20 to-red-500/10",
      text: "text-orange-400",
    },
    EV: {
      icon: "⚡",
      bg: "from-green-500/20 to-emerald-500/10",
      text: "text-green-400",
    },
    Bike: {
      icon: "🏍️",
      bg: "from-yellow-500/20 to-amber-500/10",
      text: "text-yellow-400",
    },
  };

  const currentType = typeConfig[vehicle.type] || typeConfig.Car;

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
  };

  const getBatteryColor = (level) => {
    if (level > 70) return "from-green-400 to-green-600";
    if (level > 30) return "from-yellow-400 to-yellow-600";
    return "from-red-400 to-red-600";
  };

  const getFuelColor = (level) => {
    if (level > 70) return "from-blue-400 to-blue-600";
    if (level > 30) return "from-cyan-400 to-cyan-600";
    return "from-orange-400 to-orange-600";
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(vehicle.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Glow Effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${statusConfig.bg} rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        animate={
          isHovered ? { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] } : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Glass Card */}
      <div
        className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 overflow-hidden"
        style={{
          boxShadow: `
            0 20px 40px -10px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 2px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Shimmer Effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              exit={{ x: "200%" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="relative z-10 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="font-black text-xl text-white mb-2 truncate"
              >
                {vehicle.name}
              </motion.h3>

              {/* Vehicle Type Badge - NEW PROMINENT DISPLAY */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/20 bg-gradient-to-r ${currentType.bg}`}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-xl"
                >
                  {currentType.icon}
                </motion.span>
                <span className={`text-sm font-bold ${currentType.text}`}>
                  {vehicle.type}
                </span>
              </motion.div>
            </div>

            {/* Large Icon Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              whileHover={{ scale: 1.2, rotate: 360 }}
              className="text-4xl"
            >
              {currentType.icon}
            </motion.div>
          </div>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/20"
            style={{
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-2 h-2 rounded-full ${statusConfig.dot}`}
            />
            <span className="text-xs font-bold text-white/90">
              {vehicle.status}
            </span>
            <span className="text-xs text-white/60">{statusConfig.icon}</span>
          </motion.div>
        </div>

        {/* Metrics */}
        <div className="relative z-10 space-y-4 mb-5">
          {/* Battery */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/70 flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-base"
                >
                  🔋
                </motion.span>
                Battery
              </span>
              <span className="text-xs font-bold text-white">
                {vehicle.batteryLevel.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${vehicle.batteryLevel}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                className={`h-full bg-gradient-to-r ${getBatteryColor(
                  vehicle.batteryLevel
                )} rounded-full relative overflow-hidden`}
              >
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Fuel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/70 flex items-center gap-2">
                <span className="text-base">⛽</span>
                Fuel
              </span>
              <span className="text-xs font-bold text-white">
                {vehicle.fuelLevel.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${vehicle.fuelLevel}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                className={`h-full bg-gradient-to-r ${getFuelColor(
                  vehicle.fuelLevel
                )} rounded-full relative overflow-hidden`}
              >
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1.5,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Speed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-between p-3 rounded-xl backdrop-blur-sm border border-white/10"
            style={{
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)`,
            }}
          >
            <span className="text-xs font-semibold text-white/70 flex items-center gap-2">
              <span className="text-base">💨</span>
              Speed
            </span>
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm font-bold text-white"
            >
              {vehicle.speed.toFixed(1)} km/h
            </motion.span>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex gap-3"
        >
          {/* Edit Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(vehicle)}
            className="flex-1 relative px-4 py-3 rounded-xl overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative z-10 text-blue-400 group-hover/btn:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors duration-300">
              <span>✏️</span>
              <span>Edit</span>
            </span>
          </motion.button>

          {/* Delete Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="flex-1 relative px-4 py-3 rounded-xl overflow-hidden group/btn"
          >
            <div
              className={`absolute inset-0 ${
                showDeleteConfirm
                  ? "bg-gradient-to-r from-red-500 to-pink-500"
                  : "bg-gradient-to-r from-red-500/20 to-pink-500/20"
              } border ${
                showDeleteConfirm ? "border-red-500" : "border-red-500/30"
              } rounded-xl transition-all duration-300`}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <span
              className={`relative z-10 ${
                showDeleteConfirm ? "text-white" : "text-red-400"
              } group-hover/btn:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors duration-300`}
            >
              <span>{showDeleteConfirm ? "⚠️" : "🗑️"}</span>
              <span>{showDeleteConfirm ? "Confirm?" : "Delete"}</span>
            </span>
          </motion.button>
        </motion.div>

        {/* Corner Accents */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-white/10 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-white/10 rounded-bl-2xl pointer-events-none" />
      </div>
    </motion.div>
  );
}
