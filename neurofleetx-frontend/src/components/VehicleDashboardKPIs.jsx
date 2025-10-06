import React, { useEffect, useReducer, useState, useRef } from "react";
import { fetchVehicles } from "../api/vehicleApi";
import { connectWebSocket, disconnectWebSocket } from "../api/wsClient";
import {
  vehicleReducer,
  initialVehicleState,
} from "../reducers/Vehicle/vehicleReducer";
import { VehicleActionTypes } from "../reducers/Vehicle/vehicleActionTypes";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function VehicleDashboardKPIs() {
  const [state, dispatch] = useReducer(vehicleReducer, initialVehicleState);
  const [batteryHistory, setBatteryHistory] = useState([]);
  const [fuelHistory, setFuelHistory] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const canvasRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];
  const CHART_COLORS = {
    battery: "#10b981",
    fuel: "#3b82f6",
    speed: "#8b5cf6",
    available: "#10b981",
    inUse: "#f59e0b",
    maintenance: "#ef4444",
  };

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 40;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${
              0.15 * (1 - distance / 150)
            })`;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const backgroundX = useTransform(mouseX, [0, window.innerWidth], [0, 100]);
  const backgroundY = useTransform(mouseY, [0, window.innerHeight], [0, 100]);

  useEffect(() => {
    fetchVehicles().then((data) => {
      dispatch({ type: VehicleActionTypes.SET_VEHICLES, payload: data });
      updateHistory(data);
    });

    const ws = connectWebSocket((vehicle) => {
      dispatch({ type: VehicleActionTypes.UPDATE_VEHICLE, payload: vehicle });
      updateHistory(state.allVehicles);
    });

    return () => disconnectWebSocket();
  }, []);

  const updateHistory = (vehicles) => {
    const avgBattery =
      vehicles.length > 0
        ? vehicles.reduce((sum, v) => sum + v.batteryLevel, 0) / vehicles.length
        : 0;
    const avgFuel =
      vehicles.length > 0
        ? vehicles.reduce((sum, v) => sum + v.fuelLevel, 0) / vehicles.length
        : 0;

    setBatteryHistory((prev) => [
      ...prev.slice(-9),
      {
        time: new Date().toLocaleTimeString(),
        battery: avgBattery.toFixed(1),
        fuel: avgFuel.toFixed(1),
      },
    ]);
  };

  const totalVehicles = state.allVehicles.length;
  const statusCounts = state.allVehicles.reduce(
    (acc, v) => {
      if (v.status === "Available") acc.available++;
      else if (v.status === "In Use") acc.inUse++;
      else acc.needsMaintenance++;
      return acc;
    },
    { available: 0, inUse: 0, needsMaintenance: 0 }
  );

  const pieData = [
    {
      name: "Available",
      value: statusCounts.available,
      color: CHART_COLORS.available,
    },
    { name: "In Use", value: statusCounts.inUse, color: CHART_COLORS.inUse },
    {
      name: "Maintenance",
      value: statusCounts.needsMaintenance,
      color: CHART_COLORS.maintenance,
    },
  ];

  const avgBattery =
    state.allVehicles.length > 0
      ? (
          state.allVehicles.reduce((sum, v) => sum + v.batteryLevel, 0) /
          state.allVehicles.length
        ).toFixed(1)
      : 0;

  const avgFuel =
    state.allVehicles.length > 0
      ? (
          state.allVehicles.reduce((sum, v) => sum + v.fuelLevel, 0) /
          state.allVehicles.length
        ).toFixed(1)
      : 0;

  const kpiCards = [
    {
      id: 1,
      title: "Total Fleet",
      value: totalVehicles,
      icon: "🚗",
      color: "from-blue-500 to-cyan-500",
      bg: "from-blue-500/20 to-cyan-500/10",
      change: "+3",
      trend: "up",
    },
    {
      id: 2,
      title: "Available",
      value: statusCounts.available,
      icon: "✓",
      color: "from-green-500 to-emerald-500",
      bg: "from-green-500/20 to-emerald-500/10",
      change: "+2",
      trend: "up",
    },
    {
      id: 3,
      title: "In Use",
      value: statusCounts.inUse,
      icon: "⚡",
      color: "from-yellow-500 to-orange-500",
      bg: "from-yellow-500/20 to-orange-500/10",
      change: "+5",
      trend: "up",
    },
    {
      id: 4,
      title: "Maintenance",
      value: statusCounts.needsMaintenance,
      icon: "🔧",
      color: "from-red-500 to-pink-500",
      bg: "from-red-500/20 to-pink-500/10",
      change: "-1",
      trend: "down",
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    }),
    hover: {
      y: -10,
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Animated Mesh Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at ${backgroundX}% ${backgroundY}%, 
              rgba(59, 130, 246, 0.2) 0%, 
              transparent 50%),
            radial-gradient(circle at ${100 - backgroundX}% ${
            100 - backgroundY
          }%, 
              rgba(147, 51, 234, 0.2) 0%, 
              transparent 50%),
            radial-gradient(circle at 50% 50%, 
              rgba(16, 185, 129, 0.15) 0%, 
              transparent 50%),
            linear-gradient(135deg, 
              rgba(15, 23, 42, 0.98) 0%, 
              rgba(30, 41, 59, 0.95) 50%, 
              rgba(15, 23, 42, 0.98) 100%)
          `,
          zIndex: 1,
        }}
      />

      {/* Floating orbs */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 2 }}
      >
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.2, 0.35, 0.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-emerald-500/30 to-cyan-500/30 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                Fleet Analytics
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Real-time performance metrics and insights
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
              <span className="text-white/70 text-sm font-semibold">Live</span>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, index) => (
            <motion.div
              key={card.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              onHoverStart={() => setHoveredCard(card.id)}
              onHoverEnd={() => setHoveredCard(null)}
              className="relative group cursor-pointer"
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${card.bg} rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                animate={
                  hoveredCard === card.id
                    ? { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="text-4xl"
                  >
                    {card.icon}
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      card.trend === "up"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {card.change}
                  </motion.div>
                </div>
                <motion.h3
                  className="text-4xl font-black text-white mb-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  {card.value}
                </motion.h3>
                <p className="text-white/60 text-sm font-semibold">
                  {card.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📊</span>
                  Fleet Distribution
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  Vehicle status breakdown
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📈</span>
                  Resource Trends
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  Battery & fuel levels over time
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={batteryHistory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ color: "#fff" }} />
                <Line
                  type="monotone"
                  dataKey="battery"
                  stroke={CHART_COLORS.battery}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.battery, r: 4 }}
                  name="Avg Battery %"
                />
                <Line
                  type="monotone"
                  dataKey="fuel"
                  stroke={CHART_COLORS.fuel}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.fuel, r: 4 }}
                  name="Avg Fuel %"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-3xl">
                🔋
              </div>
              <div>
                <p className="text-white/60 text-sm font-semibold">
                  Avg Battery
                </p>
                <h3 className="text-3xl font-black text-white">
                  {avgBattery}%
                </h3>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-3xl">
                ⛽
              </div>
              <div>
                <p className="text-white/60 text-sm font-semibold">Avg Fuel</p>
                <h3 className="text-3xl font-black text-white">{avgFuel}%</h3>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-3xl">
                ⚡
              </div>
              <div>
                <p className="text-white/60 text-sm font-semibold">
                  Efficiency
                </p>
                <h3 className="text-3xl font-black text-white">92%</h3>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
