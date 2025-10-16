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
import FleetMap from "../components/FleetMap";

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
        <FleetMap
          vehicles={state.allVehicles}
          height="600px"
          showControls={true}
          showLegend={true}
          defaultStyle="standard"
        />
      </div>

      {/* Modal */}
      <VehicleModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddEdit}
        vehicle={editingVehicle}
      />
    </div>
  );
}
