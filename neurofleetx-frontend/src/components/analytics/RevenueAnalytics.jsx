import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import paymentApi from "../../api/paymentApi";

const RevenueAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueStats();
  }, []);

  const loadRevenueStats = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getRevenueStatistics();
      setStats(response.data);
      console.log("💰 Revenue statistics:", response.data);
    } catch (error) {
      console.error("❌ Error loading revenue stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-white/60">Loading revenue data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <span className="text-4xl">💰</span>
              Revenue Analytics
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Real-time revenue tracking and payment statistics
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadRevenueStats}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg"
          >
            🔄 Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Total Revenue",
            value: `₹${stats?.totalRevenue?.toFixed(2) || "0.00"}`,
            icon: "💵",
            gradient: "from-green-500/20 to-emerald-500/10",
            textColor: "text-green-400",
          },
          {
            title: "Today's Revenue",
            value: `₹${stats?.todayRevenue?.toFixed(2) || "0.00"}`,
            icon: "📅",
            gradient: "from-blue-500/20 to-cyan-500/10",
            textColor: "text-blue-400",
          },
          {
            title: "This Month",
            value: `₹${stats?.monthRevenue?.toFixed(2) || "0.00"}`,
            icon: "📊",
            gradient: "from-purple-500/20 to-pink-500/10",
            textColor: "text-purple-400",
          },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative group"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
              <div className="text-4xl mb-3">{kpi.icon}</div>
              <h3 className="text-white/60 text-sm font-medium mb-2">
                {kpi.title}
              </h3>
              <p className={`text-4xl font-black ${kpi.textColor}`}>
                {kpi.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">📈</span>
          Payment Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              label: "Total Payments",
              value: stats?.totalPayments || 0,
              icon: "💳",
              color: "text-white",
            },
            {
              label: "Completed",
              value: stats?.completedPayments || 0,
              icon: "✅",
              color: "text-green-400",
            },
            {
              label: "Pending",
              value: stats?.pendingPayments || 0,
              icon: "⏳",
              color: "text-yellow-400",
            },
            {
              label: "Failed",
              value: stats?.failedPayments || 0,
              icon: "❌",
              color: "text-red-400",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="text-center backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className={`text-3xl font-black ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-white/60 text-xs mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RevenueAnalytics;
