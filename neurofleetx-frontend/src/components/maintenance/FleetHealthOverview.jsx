import React from "react";
import { motion } from "framer-motion";

const FleetHealthOverview = ({ analytics }) => {
  if (!analytics) {
    return null;
  }

  const total = analytics.total_vehicles || 0;
  const healthy = analytics.healthy || 0;
  const due = analytics.due || analytics.needs_maintenance || 0; // ✅ Fallback
  const critical = analytics.critical || 0;

  // ✅ Prevent division by zero
  const healthyPercent = total > 0 ? Math.round((healthy / total) * 100) : 0;
  const duePercent = total > 0 ? Math.round((due / total) * 100) : 0;
  const criticalPercent = total > 0 ? Math.round((critical / total) * 100) : 0;

  const cards = [
    {
      label: "Total Vehicles",
      value: total,
      icon: "🚗",
      color: "from-blue-500/20 to-cyan-500/10",
    },
    {
      label: "Healthy",
      value: healthy,
      icon: "✅",
      color: "from-green-500/20 to-emerald-500/10",
      subtext: `${healthyPercent}%`,
    },
    {
      label: "Maintenance Due",
      value: due,
      icon: "⏰",
      color: "from-yellow-500/20 to-orange-500/10",
      subtext: `${duePercent}%`,
    },
    {
      label: "Critical",
      value: critical,
      icon: "🚨",
      color: "from-red-500/20 to-pink-500/10",
      subtext: `${criticalPercent}%`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="relative group"
        >
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          />
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 10 }}
              className="text-3xl mb-3"
            >
              {card.icon}
            </motion.div>
            <h3 className="text-2xl font-black text-white mb-1">
              {card.value}
            </h3>
            <p className="text-white/60 text-sm font-semibold">{card.label}</p>
            {card.subtext && (
              <p className="text-cyan-400 text-sm font-bold mt-2">
                {card.subtext}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FleetHealthOverview;
