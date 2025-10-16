import React, { useState, useEffect, useRef } from "react";
import { getUserRole, removeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useAnimation,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const role = getUserRole();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [time, setTime] = useState(new Date());
  const controls = useAnimation();
  const canvasRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Particle animation on canvas [web:144][web:150]
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 60;

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

      // Draw connections
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

  // Mouse tracking for gradient
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  const handleNavigation = (module) => {
    switch (module) {
      case "fleet":
        navigate("/vehicles");
        break;
      case "analytics":
        navigate("/vehicles/kpi");
        break;
      case "booking":
        navigate("/booking");
        break;
      case "admin":
        navigate("/admin");
        break;
      case "routes":
        navigate("/routes");
        break;
      case "maintenance":
        navigate("/maintenance");
        break;
      default:
        navigate("/");
    }
  };

  // Dynamic gradient background [web:142]
  const backgroundX = useTransform(mouseX, [0, window.innerWidth], [0, 100]);
  const backgroundY = useTransform(mouseY, [0, window.innerHeight], [0, 100]);

  // Module cards configuration
  const getModuleCards = () => {
    const baseModules = [
      {
        id: "fleet",
        title: "Fleet Inventory",
        description: "Manage vehicles & telemetry",
        icon: "🚗",
        gradient: "from-emerald-500 to-teal-500",
        bgGradient: "from-emerald-500/20 to-teal-500/10",
        stats: { count: "24", label: "Vehicles" },
        roles: ["Admin", "MANAGER", "ADMIN"],
      },
      {
        id: "analytics",
        title: "Fleet Analytics",
        description: "KPIs & Performance Metrics",
        icon: "📊",
        gradient: "from-blue-500 to-cyan-500",
        bgGradient: "from-blue-500/20 to-cyan-500/10",
        stats: { count: "92%", label: "Efficiency" },
        roles: ["Admin", "MANAGER", "ADMIN"],
      },
      {
        id: "routes",
        title: "AI Route Optimization",
        description: "Smart routing & ETA prediction",
        icon: "🗺️",
        gradient: "from-purple-500 to-pink-500",
        bgGradient: "from-purple-500/20 to-pink-500/10",
        stats: { count: "15%", label: "Time Saved" },
        roles: ["Admin", "MANAGER", "DRIVER", "ADMIN"],
      },
      {
        id: "maintenance",
        title: "Predictive Maintenance",
        description: "Vehicle health & alerts",
        icon: "🔧",
        gradient: "from-orange-500 to-red-500",
        bgGradient: "from-orange-500/20 to-red-500/10",
        stats: { count: "3", label: "Alerts" },
        roles: ["Admin", "MANAGER", "ADMIN"],
      },
      {
        id: "booking",
        title: "Smart Booking",
        description: "AI-powered recommendations",
        icon: "📱",
        gradient: "from-indigo-500 to-purple-500",
        bgGradient: "from-indigo-500/20 to-purple-500/10",
        stats: { count: "12", label: "Active" },
        roles: ["CUSTOMER", "Admin", "ADMIN"],
      },
      {
        id: "admin",
        title: "Urban Insights",
        description: "Heatmaps & City Analytics",
        icon: "🌆",
        gradient: "from-yellow-500 to-orange-500",
        bgGradient: "from-yellow-500/20 to-orange-500/10",
        stats: { count: "Live", label: "Dashboard" },
        roles: ["Admin", "ADMIN"],
      },
    ];

    return baseModules.filter((module) => module.roles.includes(role));
  };

  const moduleCards = getModuleCards();

  // Quick action buttons
  const quickActionButtons = [
    {
      id: "fleet",
      label: "Fleet Inventory",
      icon: "🚗",
      gradient: "from-emerald-500 to-teal-600",
      roles: ["Admin", "MANAGER", "ADMIN"],
    },
    {
      id: "analytics",
      label: "Fleet Analytics",
      icon: "📊",
      gradient: "from-blue-500 to-cyan-600",
      roles: ["Admin", "MANAGER", "ADMIN"],
    },
    {
      id: "routes",
      label: "Route Optimizer",
      icon: "🗺️",
      gradient: "from-purple-500 to-pink-600",
      roles: ["Admin", "MANAGER", "DRIVER", "ADMIN"],
    },
    {
      id: "booking",
      label: "Book Vehicle",
      icon: "📱",
      gradient: "from-indigo-500 to-purple-600",
      roles: ["CUSTOMER", "Admin", "ADMIN"],
    },
    {
      id: "admin",
      label: "Admin Panel",
      icon: "⚙️",
      gradient: "from-yellow-500 to-orange-600",
      roles: ["Admin", "ADMIN"],
    },
  ];

  const filteredButtons = quickActionButtons.filter((btn) =>
    btn.roles.includes(role)
  );

  // Quick stats data
  const quickStats = [
    {
      label: "Total Fleet",
      value: "24",
      change: "+3",
      trend: "up",
      icon: "🚗",
    },
    {
      label: "Active Routes",
      value: "18",
      change: "+5",
      trend: "up",
      icon: "🗺️",
    },
    {
      label: "Trips Today",
      value: "47",
      change: "+12",
      trend: "up",
      icon: "📍",
    },
    {
      label: "Efficiency",
      value: "92%",
      change: "+2%",
      trend: "up",
      icon: "⚡",
    },
  ];

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    }),
    hover: {
      scale: 1.05,
      y: -10,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  // Button animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: { scale: 0.95 },
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Canvas Background [web:144][web:150] */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Animated Mesh Gradient Background [web:140][web:142] */}
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

      {/* Animated floating orbs [web:140] */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 2 }}
      >
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
            rotate: [0, 180, 360],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.2, 0.35, 0.2],
            rotate: [360, 180, 0],
            x: [0, -40, 0],
            y: [0, -25, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-emerald-500/30 to-cyan-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.25, 0.1],
            rotate: [0, -180, -360],
            x: [0, 30, 0],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gradient-to-r from-pink-500/25 to-orange-500/25 rounded-full blur-3xl"
        />
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Brand & Welcome */}
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="text-4xl"
              >
                🚀
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400"
                >
                  NeuroFleetX
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 text-sm mt-1"
                >
                  Welcome back,{" "}
                  <span className="text-emerald-400 font-semibold">{role}</span>
                </motion.p>
              </div>
            </div>

            {/* Right: Time & Actions */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden md:flex flex-col items-end px-4 py-2 rounded-xl bg-white/5 border border-white/10"
              >
                <span className="text-white/60 text-xs">Current Time</span>
                <span className="text-white font-mono text-lg">
                  {time.toLocaleTimeString()}
                </span>
              </motion.div>

              <motion.button
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={handleLogout}
                className="relative px-6 py-3 rounded-xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center gap-2 text-red-400 group-hover:text-white font-semibold transition-colors duration-300">
                  <span>🚪</span>
                  Logout
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-white/80 text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📈</span>
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="text-3xl"
                    >
                      {stat.icon}
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        stat.trend === "up"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {stat.change}
                    </motion.div>
                  </div>
                  <motion.h3
                    className="text-3xl font-black text-white mb-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    {stat.value}
                  </motion.h3>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Action Buttons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-white/80 text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            {filteredButtons.map((button, i) => (
              <motion.button
                key={button.id}
                custom={i}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onHoverStart={() => setHoveredButton(button.id)}
                onHoverEnd={() => setHoveredButton(null)}
                onClick={() => handleNavigation(button.id)}
                className="relative group overflow-hidden"
              >
                {/* Base layer */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 p-[2px]">
                  <div className="w-full h-full bg-slate-900/50 backdrop-blur-xl rounded-2xl" />
                </div>

                {/* Animated gradient */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${button.gradient} opacity-0 group-hover:opacity-100 rounded-2xl`}
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Shimmer effect */}
                <AnimatePresence>
                  {hoveredButton === button.id && (
                    <motion.div
                      initial={{ x: "-100%", opacity: 0.5 }}
                      animate={{ x: "200%", opacity: 0.8 }}
                      exit={{ x: "200%", opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                  )}
                </AnimatePresence>

                {/* Button content */}
                <div className="relative z-10 px-8 py-4 flex items-center gap-3">
                  <motion.span
                    animate={
                      hoveredButton === button.id
                        ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{ duration: 0.3 }}
                    className="text-2xl"
                  >
                    {button.icon}
                  </motion.span>
                  <span className="text-white font-bold text-base whitespace-nowrap">
                    {button.label}
                  </span>
                  <motion.span
                    initial={{ x: -5, opacity: 0 }}
                    animate={
                      hoveredButton === button.id
                        ? { x: 0, opacity: 1 }
                        : { x: -5, opacity: 0 }
                    }
                    transition={{ duration: 0.2 }}
                    className="text-white"
                  >
                    →
                  </motion.span>
                </div>

                {/* Glow effect */}
                <motion.div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${button.gradient} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
                  style={{ zIndex: -1 }}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Additional Action Buttons (restored from original) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-white/80 text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Direct Access
          </h2>
          <div className="flex flex-wrap gap-4">
            <motion.button
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleNavigation("fleet")}
              className="relative px-6 py-3 rounded-lg overflow-hidden group"
            >
              <div className="absolute inset-0 bg-green-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.4 }}
              />
              <span className="relative z-10 text-white font-semibold flex items-center gap-2">
                <span>🚗</span>
                Fleet Inventory
              </span>
            </motion.button>

            <motion.button
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleNavigation("analytics")}
              className="relative px-6 py-3 rounded-lg overflow-hidden group"
            >
              <div className="absolute inset-0 bg-blue-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.4 }}
              />
              <span className="relative z-10 text-white font-semibold flex items-center gap-2">
                <span>📊</span>
                Fleet Analytics
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Module Cards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-white/80 text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Module Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moduleCards.map((card, i) => (
              <motion.div
                key={card.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                onHoverStart={() => setHoveredCard(card.id)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={() => handleNavigation(card.id)}
                className="relative group cursor-pointer"
              >
                {/* Glow effect */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  animate={
                    hoveredCard === card.id
                      ? { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }
                      : {}
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Card content */}
                <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-300 overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                  </div>

                  {/* Icon & Badge */}
                  <div className="relative flex items-start justify-between mb-6">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="text-5xl"
                    >
                      {card.icon}
                    </motion.div>
                    {card.stats && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                        className={`px-4 py-2 rounded-xl bg-gradient-to-r ${card.gradient} text-white font-bold text-sm shadow-lg`}
                      >
                        {card.stats.count}
                      </motion.div>
                    )}
                  </div>

                  {/* Text content */}
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                      {card.description}
                    </p>

                    {card.stats && (
                      <div className="flex items-center gap-2 text-white/50 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {card.stats.label}
                      </div>
                    )}
                  </div>

                  {/* Hover arrow */}
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={
                      hoveredCard === card.id
                        ? { x: 0, opacity: 1 }
                        : { x: -10, opacity: 0 }
                    }
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-8 right-8 text-white/60"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </motion.div>

                  {/* Shimmer effect */}
                  <AnimatePresence>
                    {hoveredCard === card.id && (
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        exit={{ x: "200%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Assistant Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
          <div className="relative backdrop-blur-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center gap-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-6xl"
              >
                🤖
              </motion.div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">
                  AI-Powered Insights Ready
                </h3>
                <p className="text-white/60 text-sm">
                  Real-time optimization, predictive analytics, and smart
                  recommendations powered by machine learning
                </p>
              </div>
              <motion.button
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                className="relative px-6 py-3 rounded-xl overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl" />
                <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 text-white font-bold">
                  Explore AI
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 text-center py-6 text-white/40 text-sm"
      >
        <p>© 2025 NeuroFleetX - AI-Driven Urban Mobility Platform</p>
      </motion.div>
    </div>
  );
}
