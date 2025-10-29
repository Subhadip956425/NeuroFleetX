import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useGlobalState } from "../../context/GlobalState";

// Premium color palette
const COLORS = {
  healthy: "#10b981", // Green
  due: "#f59e0b", // Orange
  critical: "#ef4444", // Red
  primary: "#3b82f6", // Blue
  secondary: "#8b5cf6", // Purple
  accent: "#06b6d4", // Cyan
};

const PIE_COLORS = [COLORS.healthy, COLORS.due, COLORS.critical];

const MaintenanceCharts = ({ vehicles = [], tickets = [] }) => {
  const { state } = useGlobalState();
  const [tireWearData, setTireWearData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [healthTrendData, setHealthTrendData] = useState([]);

  useEffect(() => {
    const vehicleData = vehicles.length > 0 ? vehicles : state.vehicles;
    const ticketData = tickets.length > 0 ? tickets : state.tickets || [];

    // 1. Tire Wear Data (Top 10 vehicles)
    const tireData = vehicleData
      .slice(0, 10)
      .map((v) => ({
        name: v.name?.substring(0, 10) || `V${v.id}`,
        wear: Math.round(v.tireWear || 0),
        battery: Math.round(v.batteryLevel || 100),
      }))
      .sort((a, b) => b.wear - a.wear);

    setTireWearData(tireData);

    // 2. Maintenance Status Pie Chart
    const healthyCount = vehicleData.filter(
      (v) => (v.tireWear || 0) < 50
    ).length;
    const dueCount = vehicleData.filter(
      (v) => (v.tireWear || 0) >= 50 && (v.tireWear || 0) < 80
    ).length;
    const criticalCount = vehicleData.filter(
      (v) => (v.tireWear || 0) >= 80
    ).length;

    setPieData([
      { name: "Healthy", value: healthyCount, color: COLORS.healthy },
      { name: "Due Soon", value: dueCount, color: COLORS.due },
      { name: "Critical", value: criticalCount, color: COLORS.critical },
    ]);

    // 3. Overall Health Trend (Mock data - last 7 days)
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        healthy: healthyCount + Math.floor(Math.random() * 5 - 2),
        due: dueCount + Math.floor(Math.random() * 3 - 1),
        critical: criticalCount + Math.floor(Math.random() * 2 - 1),
      };
    });

    setHealthTrendData(trendData);
  }, [state.vehicles, state.tickets, vehicles, tickets]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-3 shadow-xl">
          <p className="text-white font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name.includes("Wear") ? "%" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Tire Wear Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span>🔧</span>
            Tire Wear Analysis
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tireWearData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                style={{ fontSize: "12px" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="wear" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 2. Maintenance Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span>📊</span>
            Fleet Health Status
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index] }}
                />
                <span className="text-white/80 text-xs">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 3. Health Trend Line Chart (Full Width) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>📈</span>
          7-Day Health Trend
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={healthTrendData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.6)"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.6)"
              style={{ fontSize: "12px" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "white" }} iconType="circle" />
            <Line
              type="monotone"
              dataKey="healthy"
              stroke={COLORS.healthy}
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Healthy"
            />
            <Line
              type="monotone"
              dataKey="due"
              stroke={COLORS.due}
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Due Soon"
            />
            <Line
              type="monotone"
              dataKey="critical"
              stroke={COLORS.critical}
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Critical"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            label: "Average Tire Wear",
            value: `${Math.round(
              tireWearData.reduce((sum, v) => sum + v.wear, 0) /
                (tireWearData.length || 1)
            )}%`,
            icon: "🔧",
            color: COLORS.primary,
          },
          {
            label: "Vehicles Due Soon",
            value: pieData.find((p) => p.name === "Due Soon")?.value || 0,
            icon: "⚠️",
            color: COLORS.due,
          },
          {
            label: "Critical Alerts",
            value: pieData.find((p) => p.name === "Critical")?.value || 0,
            icon: "🚨",
            color: COLORS.critical,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${stat.color}20` }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-white/60 text-xs">{stat.label}</p>
              <p className="text-white font-bold text-2xl">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default MaintenanceCharts;
