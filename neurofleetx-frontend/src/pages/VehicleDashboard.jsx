import React, { useEffect, useReducer, useState, useRef } from "react";
import { fetchVehicles } from "../api/vehicleApi";
import axios from "axios";
import VehicleCard from "../components/VehicleCard";
import VehicleModal from "../components/VehicleModal";
import {
  vehicleReducer,
  initialVehicleState,
} from "../reducers/Vehicle/vehicleReducer";
import { VehicleActionTypes } from "../reducers/Vehicle/vehicleActionTypes";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map auto-fit component
function MapAutoFit({ vehicles }) {
  const map = useMap();

  useEffect(() => {
    if (vehicles.length > 0) {
      const validVehicles = vehicles.filter(
        (v) =>
          v.latitude &&
          v.longitude &&
          !isNaN(v.latitude) &&
          !isNaN(v.longitude) &&
          Math.abs(v.latitude) <= 90 &&
          Math.abs(v.longitude) <= 180
      );

      if (validVehicles.length > 0) {
        const bounds = L.latLngBounds(
          validVehicles.map((v) => [v.latitude, v.longitude])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [vehicles, map]);

  return null;
}

export default function VehicleDashboard() {
  const [state, dispatch] = useReducer(vehicleReducer, initialVehicleState);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [mapView, setMapView] = useState("all");
  const [mapStyle, setMapStyle] = useState("standard"); // standard, dark, satellite

  const [filters, setFilters] = useState({ type: "", status: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const itemsPerPage = 8;

  const canvasRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const API_URL = "http://localhost:8080/api/vehicles";

  // Map tile options
  const mapTiles = {
    standard: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri",
    },
    light: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  };

  // Particle animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

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
    setIsLoading(true);
    fetchVehicles().then((data) => {
      dispatch({ type: VehicleActionTypes.SET_VEHICLES, payload: data });
      setIsLoading(false);
    });
  }, []);

  const handleAddEdit = async (vehicle) => {
    const token = localStorage.getItem("token");
    try {
      if (vehicle.id) {
        const res = await axios.put(`${API_URL}/${vehicle.id}`, vehicle, {
          headers: { Authorization: `Bearer ${token}` },
        });
        dispatch({
          type: VehicleActionTypes.UPDATE_VEHICLE,
          payload: res.data,
        });
      } else {
        const res = await axios.post(API_URL, vehicle, {
          headers: { Authorization: `Bearer ${token}` },
        });
        dispatch({ type: VehicleActionTypes.ADD_VEHICLE, payload: res.data });
      }
    } catch (error) {
      console.error("Error saving vehicle:", error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    dispatch({ type: VehicleActionTypes.DELETE_VEHICLE, payload: id });
  };

  // Custom marker icons based on status
  const getMarkerIcon = (status) => {
    const iconColors = {
      Available: "#10b981",
      "In Use": "#f59e0b",
      "Needs Maintenance": "#ef4444",
      Offline: "#6b7280",
    };

    const color = iconColors[status] || "#3b82f6";

    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
        ">
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          "></div>
          <div style="
            position: absolute;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            top: 6px;
            left: 10px;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  // Apply filters and search
  const filteredVehicles = state.allVehicles
    .filter((v) =>
      filters.type ? v.type.toLowerCase() === filters.type.toLowerCase() : true
    )
    .filter((v) =>
      filters.status
        ? v.status.toLowerCase() === filters.status.toLowerCase()
        : true
    )
    .filter((v) =>
      searchTerm
        ? v.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  // Filter vehicles for map
  const mapVehicles = state.allVehicles
    .filter((v) => {
      if (mapView === "available") return v.status === "Available";
      if (mapView === "inUse") return v.status === "In Use";
      return true;
    })
    .filter(
      (v) =>
        v.latitude &&
        v.longitude &&
        !isNaN(v.latitude) &&
        !isNaN(v.longitude) &&
        Math.abs(v.latitude) <= 90 &&
        Math.abs(v.longitude) <= 180
    );

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
      transition: { type: "spring", stiffness: 400, damping: 17 },
    },
    tap: { scale: 0.95 },
  };

  // Stats calculation
  const stats = {
    total: state.allVehicles.length,
    available: state.allVehicles.filter((v) => v.status === "Available").length,
    inUse: state.allVehicles.filter((v) => v.status === "In Use").length,
    maintenance: state.allVehicles.filter(
      (v) => v.status === "Needs Maintenance"
    ).length,
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

      {/* Animated floating orbs */}
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
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section - keeping existing code */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="text-5xl"
              >
                🚗
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400"
                >
                  Fleet Management
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60 text-sm mt-1"
                >
                  Monitor and manage your vehicle fleet in real-time
                </motion.p>
              </div>
            </div>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => {
                setEditingVehicle(null);
                setShowModal(true);
              }}
              className="relative px-6 py-3 rounded-xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10 flex items-center gap-2 text-green-400 group-hover:text-white font-bold transition-colors duration-300">
                <span>➕</span>
                <span>Add Vehicle</span>
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards - keeping existing code */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Total Vehicles",
              value: stats.total,
              icon: "🚗",
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/20 to-cyan-500/10",
            },
            {
              label: "Available",
              value: stats.available,
              icon: "✓",
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-500/20 to-emerald-500/10",
            },
            {
              label: "In Use",
              value: stats.inUse,
              icon: "⚡",
              gradient: "from-yellow-500 to-orange-500",
              bgGradient: "from-yellow-500/20 to-orange-500/10",
            },
            {
              label: "Maintenance",
              value: stats.maintenance,
              icon: "🔧",
              gradient: "from-red-500 to-pink-500",
              bgGradient: "from-red-500/20 to-pink-500/10",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              onHoverStart={() => setHoveredStat(index)}
              onHoverEnd={() => setHoveredStat(null)}
              className="relative group cursor-pointer"
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                animate={
                  hoveredStat === index
                    ? { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 text-6xl opacity-10">
                  {stat.icon}
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-white/70">
                    {stat.label}
                  </p>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                    className="text-4xl font-black text-white mt-2"
                  >
                    {stat.value}
                  </motion.p>
                </div>

                <AnimatePresence>
                  {hoveredStat === index && (
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
        </motion.div>

        {/* Filters and Search - keeping existing code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-lg p-6"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px] relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-xl">
                🔍
              </span>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                placeholder="Search vehicles by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-xl focus:outline-none focus:border-blue-500 placeholder-white/50 transition-all"
              />
            </div>

            <motion.select
              whileFocus={{ scale: 1.02 }}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-xl focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="" className="bg-gray-800">
                All Types
              </option>
              <option value="Truck" className="bg-gray-800">
                🚚 Truck
              </option>
              <option value="Car" className="bg-gray-800">
                🚗 Car
              </option>
              <option value="Van" className="bg-gray-800">
                🚐 Van
              </option>
            </motion.select>

            <motion.select
              whileFocus={{ scale: 1.02 }}
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-xl focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="" className="bg-gray-800">
                All Status
              </option>
              <option value="Available" className="bg-gray-800">
                ✓ Available
              </option>
              <option value="In Use" className="bg-gray-800">
                ⚡ In Use
              </option>
              <option value="Needs Maintenance" className="bg-gray-800">
                🔧 Maintenance
              </option>
            </motion.select>

            <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-white/20 text-white shadow-md"
                    : "text-white/60"
                }`}
              >
                📊 Grid
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-white/20 text-white shadow-md"
                    : "text-white/60"
                }`}
              >
                📋 List
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Loading, Vehicle Grid, Empty State, Pagination - keeping existing code... */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col justify-center items-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/60 mt-4 font-semibold"
            >
              Loading vehicles...
            </motion.p>
          </motion.div>
        )}

        {!isLoading && (
          <motion.div
            layout
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            <AnimatePresence mode="popLayout">
              {paginatedVehicles.map((v, index) => (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <VehicleCard
                    vehicle={v}
                    onEdit={(v) => {
                      setEditingVehicle(v);
                      setShowModal(true);
                    }}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && paginatedVehicles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-lg p-12 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-4"
            >
              🚗
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Vehicles Found
            </h3>
            <p className="text-white/60">
              Try adjusting your filters or add a new vehicle to get started.
            </p>
          </motion.div>
        )}

        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-2"
          >
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 backdrop-blur-xl bg-white/5 border border-white/20 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              ← Prev
            </motion.button>

            {Array.from({ length: totalPages }, (_, i) => (
              <motion.button
                key={i}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currentPage === i + 1
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "backdrop-blur-xl bg-white/5 border border-white/20 text-white hover:bg-white/10"
                }`}
              >
                {i + 1}
              </motion.button>
            ))}

            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 backdrop-blur-xl bg-white/5 border border-white/20 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              Next →
            </motion.button>
          </motion.div>
        )}

        {/* FIXED MAP SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Map Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🗺️
                  </motion.span>
                  <span>Live Fleet Map</span>
                </h2>
                <p className="text-white/60 mt-1 text-sm">
                  Real-time vehicle locations • {mapVehicles.length} vehicles
                  displayed
                </p>
              </div>

              <div className="flex gap-4 flex-wrap">
                {/* Map Style Selector */}
                <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapStyle("standard")}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                      mapStyle === "standard"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    🗺️ Standard
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapStyle("light")}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                      mapStyle === "light"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    ☀️ Light
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapStyle("dark")}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                      mapStyle === "dark"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    🌙 Dark
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapStyle("satellite")}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                      mapStyle === "satellite"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    🛰️ Satellite
                  </motion.button>
                </div>

                {/* Map Filter Buttons */}
                <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapView("all")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      mapView === "all"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    All ({state.allVehicles.length})
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapView("available")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      mapView === "available"
                        ? "bg-white/20 text-emerald-400 shadow-md"
                        : "text-white/60 hover:text-emerald-400"
                    }`}
                  >
                    Available ({stats.available})
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapView("inUse")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      mapView === "inUse"
                        ? "bg-white/20 text-yellow-400 shadow-md"
                        : "text-white/60 hover:text-yellow-400"
                    }`}
                  >
                    In Use ({stats.inUse})
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="h-[600px] w-full relative overflow-hidden"
          >
            {mapVehicles.length > 0 ? (
              <MapContainer
                center={[20, 0]}
                zoom={2}
                className="h-full w-full z-0"
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url={mapTiles[mapStyle].url}
                  attribution={mapTiles[mapStyle].attribution}
                />
                <MapAutoFit vehicles={mapVehicles} />
                {mapVehicles.map((v) => (
                  <Marker
                    key={v.id}
                    position={[v.latitude, v.longitude]}
                    icon={getMarkerIcon(v.status)}
                  >
                    <Popup className="custom-popup">
                      <div className="p-3 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">🚗</div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {v.name}
                            </h3>
                            <p className="text-sm text-gray-600">{v.type}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                              Status
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                v.status === "Available"
                                  ? "text-green-600"
                                  : v.status === "In Use"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {v.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-lg">🔋</span>
                                <span className="text-xs text-gray-600">
                                  Battery
                                </span>
                              </div>
                              <p className="text-lg font-bold text-green-700">
                                {v.batteryLevel.toFixed(0)}%
                              </p>
                            </div>

                            <div className="p-2 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-lg">⛽</span>
                                <span className="text-xs text-gray-600">
                                  Fuel
                                </span>
                              </div>
                              <p className="text-lg font-bold text-blue-700">
                                {v.fuelLevel.toFixed(0)}%
                              </p>
                            </div>
                          </div>

                          {v.speed > 0 && (
                            <div className="p-2 bg-purple-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  💨 Speed
                                </span>
                                <span className="text-sm font-bold text-purple-700">
                                  {v.speed.toFixed(1)} km/h
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-900/50">
                <div className="text-center">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-white/60">No vehicles to display on map</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Map Legend */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-white/70">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-white/70">In Use</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-white/70">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-white/70">Offline</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <VehicleModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddEdit}
        vehicle={editingVehicle}
      />

      {/* Custom CSS for Leaflet */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .leaflet-popup-tip {
          background: white;
        }
        .leaflet-container {
          font-family: inherit;
          background: transparent !important;
        }
        .leaflet-control-zoom {
          border: 2px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: rgba(255, 255, 255, 0.9) !important;
          color: #333 !important;
          border: none !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 20px !important;
          font-weight: bold;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255, 255, 255, 1) !important;
        }
        .leaflet-tile-pane {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
