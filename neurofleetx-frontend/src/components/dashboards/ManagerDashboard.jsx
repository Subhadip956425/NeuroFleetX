import React, { useEffect, useState, useRef } from "react";
import { useGlobalState, actionTypes } from "../../context/GlobalState.jsx";
import { connectWebSocket } from "../../api/wsClient";
import { fetchVehicles } from "../../api/vehicleApi";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import FleetMap from "../map/FleetMap.jsx";
import VehicleDashboardKPIs from "../../components/VehicleDashboardKPIs";
import routeApi from "../../api/routeApi";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { VehicleActionTypes } from "../../reducers/Vehicle/vehicleActionTypes.js";
import RouteMap from "../map/RouteMap.jsx";
import RouteForm from "../manager/RouteForm.jsx";
import RouteList from "../manager/RouteList.jsx";
import MaintenanceCharts from "../maintenance/MaintenanceCharts.jsx";
import maintenanceApi from "../../api/maintenanceApi.js";
import { connectMaintenanceSocket } from "../../api/wsMaintenance";
import AlertsTable from "../maintenance/AlertsTable.jsx";
import VehicleHealthCard from "../maintenance/VehicleHealthCard.jsx";
import BookingManager from "../booking/BookingManager.jsx";
import vehicleApi from "../../api/vehicleApi";
import VehicleCard from "../VehicleCard.jsx";
// Add these new imports after your existing imports
import AIMaintenanceDashboard from "../maintenance/AIMaintenanceDashboard";

const ManagerDashboard = () => {
  const { state, dispatch } = useGlobalState();
  const navigate = useNavigate();

  // State management
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [selectedForAssignment, setSelectedForAssignment] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [maintenanceTickets, setMaintenanceTickets] = useState([]);
  const [criticalVehicles, setCriticalVehicles] = useState([]);
  const [predictions, setPredictions] = useState([]);

  const canvasRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // User info
  const userRole = localStorage.getItem("role") || "MANAGER";
  const userEmail = state.user?.username || "manager@neurofleetx.com";

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 30;

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

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        console.log("📊 Loading AI predictions...");
        const data = await maintenanceApi.getAllPredictions();
        setPredictions(data);
        console.log("✅ Predictions loaded:", data);
      } catch (err) {
        console.error("❌ Error loading predictions:", err);
      }
    };

    if (viewMode === "maintenance") {
      loadPredictions();
    }
  }, [viewMode]);

  // Health Analytics
  useEffect(() => {
    const loadMaintenanceData = async () => {
      try {
        const tickets = await maintenanceApi.getOpenTickets();
        setMaintenanceTickets(tickets.data || tickets);
        dispatch({
          type: actionTypes.SET_TICKETS,
          payload: tickets.data || tickets,
        });
      } catch (error) {
        console.error("Error loading maintenance data:", error);
        setMaintenanceTickets([]);
      }
    };

    loadMaintenanceData();

    // ✅ Safely connect WebSocket (won't crash if it fails)
    try {
      connectMaintenanceSocket((ticketUpdate) => {
        if (!ticketUpdate.status || ticketUpdate.status === "OPEN") {
          dispatch({ type: actionTypes.ADD_TICKET, payload: ticketUpdate });
          setMaintenanceTickets((prev) => [...prev, ticketUpdate]);
        } else {
          dispatch({ type: actionTypes.UPDATE_TICKET, payload: ticketUpdate });
          setMaintenanceTickets((prev) =>
            prev.map((t) => (t.id === ticketUpdate.id ? ticketUpdate : t))
          );
        }
      });
    } catch (error) {
      console.warn(
        "WebSocket not available, continuing without real-time updates"
      );
    }

    return () => {
      try {
        import("../../api/wsMaintenance").then((m) =>
          m.disconnectMaintenanceSocket()
        );
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [dispatch]);

  const backgroundX = useTransform(mouseX, [0, window.innerWidth], [0, 100]);
  const backgroundY = useTransform(mouseY, [0, window.innerHeight], [0, 100]);

  // Load data
  // Move outside of useEffect
  const loadData = async () => {
    try {
      // ✅ FIXED: Use vehicleApi directly to get fresh data
      const vehicles = await vehicleApi.fetchVehicles("MANAGER");

      // ✅ Map vehicles to ensure all properties are present
      const normalizedVehicles = vehicles.map((v) => ({
        ...v,
        assignedDriverId: v.assignedDriverId || null,
        assignedDriverName: v.assignedDriverName || null,
        status: v.status || "Available",
      }));

      dispatch({ type: actionTypes.SET_VEHICLES, payload: normalizedVehicles });
      console.log("✅ Vehicles loaded:", normalizedVehicles);

      // Load drivers
      try {
        const driversRes = await axiosInstance.get("/manager/drivers");
        setDrivers(driversRes.data || []);
      } catch (error) {
        console.error("Error loading drivers:", error);
        setDrivers([]);
      }

      // Load trips
      try {
        const tripsRes = await axiosInstance.get("/trips");
        setTrips(tripsRes.data || []);
      } catch (error) {
        console.error("Error loading trips:", error);
        setTrips([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // ✅ NEW: Load critical vehicle alerts
  const loadCriticalVehicles = async () => {
    try {
      const critical = await maintenanceApi.getCriticalVehicles();
      setCriticalVehicles(critical);
      console.log("🚨 Critical vehicles loaded:", critical);
    } catch (error) {
      console.error("Error loading critical vehicles:", error);
      setCriticalVehicles([]);
    }
  };

  // Add loadRoutes function
  const loadRoutes = async () => {
    try {
      const res = await routeApi.getManagerRoutes();
      dispatch({ type: actionTypes.SET_ROUTES, payload: res.data || res });
    } catch (err) {
      console.error("Error loading routes:", err);
    }
  };

  // Add this after handleUnassignDriver function:

  const handleEditVehicle = (vehicle) => {
    console.log("✏️ Editing vehicle:", vehicle.id);
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm("🚫 Are you sure you want to delete this vehicle?")) {
      return;
    }

    try {
      console.log("🗑️ Deleting vehicle:", vehicleId);
      await axiosInstance.delete(`/vehicles/${vehicleId}`);

      // Update state
      const updatedVehicles = state.vehicles.filter((v) => v.id !== vehicleId);
      dispatch({
        type: actionTypes.SET_VEHICLES,
        payload: updatedVehicles,
      });

      alert("✅ Vehicle deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting vehicle:", error);
      alert(`❌ Failed to delete vehicle: ${error.message}`);
    }
  };

  // Call it in useEffect
  useEffect(() => {
    loadData();
    loadRoutes();
    loadCriticalVehicles();

    connectWebSocket((data) =>
      dispatch({ type: actionTypes.UPDATE_TELEMETRY, payload: data })
    );
  }, [dispatch]);

  // Load route data from web socket
  useEffect(() => {
    connectWebSocket((routeUpdate) => {
      if (routeUpdate.driver?.id === state.user.id) {
        dispatch({ type: actionTypes.UPDATE_ROUTE, payload: routeUpdate });
      }
    });
  }, [dispatch, state.user.id]);

  // Filter vehicles
  const filteredVehicles = state.vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      vehicle.status.toLowerCase().replace(/\s+/g, "") ===
        filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Manager Operations
  const handleViewVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  // Replace with this single, correct implementation:

  const handleAssignDriver = async (vehicle) => {
    if (!vehicle || !vehicle.id) {
      alert("❌ Invalid vehicle");
      return;
    }

    try {
      setSelectedForAssignment(vehicle);
      setShowAssignModal(true);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmitAssignment = async (vehicleId, driverId) => {
    if (!driverId) {
      alert("❌ Please select a driver");
      return;
    }

    try {
      console.log(`👤 Assigning driver ${driverId} to vehicle ${vehicleId}`);

      const updatedVehicle = await vehicleApi.assignDriver(vehicleId, driverId);
      console.log("✅ Backend response:", updatedVehicle);

      // ✅ Update state immediately
      const updatedVehicles = state.vehicles.map((v) => {
        if (v.id === vehicleId) {
          const updated = {
            ...v,
            assignedDriverId: updatedVehicle.assignedDriverId,
            status: updatedVehicle.status || "In Use",
          };
          console.log("✅ Updated vehicle in state:", updated);
          return updated;
        }
        return v;
      });

      dispatch({
        type: actionTypes.SET_VEHICLES,
        payload: updatedVehicles,
      });

      alert(`✅ Driver assigned successfully`);
      setShowAssignModal(false);
      setSelectedForAssignment(null);
      setSelectedDriver("");
    } catch (error) {
      console.error("❌ Error:", error);
      alert(`❌ Failed: ${error.message}`);
    }
  };

  const handleUnassignDriver = async (vehicle) => {
    if (!window.confirm(`🚫 Unassign driver from ${vehicle.name}?`)) {
      return;
    }

    try {
      console.log(`🚫 Unassigning driver from vehicle ${vehicle.id}`);

      const updatedVehicle = await vehicleApi.unassignDriver(vehicle.id);

      console.log("✅ Unassignment successful:", updatedVehicle);

      // ✅ Update state
      const updatedVehicles = state.vehicles.map((v) =>
        v.id === vehicle.id
          ? {
              ...v,
              ...updatedVehicle, // ✅ Spread all properties
              assignedDriverId: null,
              assignedDriverName: null,
              status: updatedVehicle.status || "Available",
            }
          : v
      );

      dispatch({
        type: actionTypes.SET_VEHICLES,
        payload: updatedVehicles,
      });

      alert(`✅ Driver unassigned from ${vehicle.name}`);

      // ✅ RELOAD data from backend
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (error) {
      console.error("❌ Error unassigning driver:", error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`❌ Failed to unassign driver: ${errorMsg}`);
    }
  };

  // Add this function with other handlers
  const handleCancelAssignment = async (vehicle) => {
    if (!window.confirm(`Cancel driver assignment for ${vehicle.name}?`))
      return;

    try {
      const res = await axiosInstance.post(
        `/manager/vehicles/${vehicle.id}/unassign`
      );
      const updatedVehicle = res.data;

      // Update frontend state immediately
      const updatedVehicles = state.vehicles.map((v) =>
        v.id === vehicle.id
          ? {
              ...v,
              assignedDriverId: null,
              assignedDriverName: null,
            }
          : v
      );

      dispatch({
        type: actionTypes.SET_VEHICLES,
        payload: updatedVehicles,
      });

      alert(`Driver unassigned successfully from ${vehicle.name}`);
    } catch (error) {
      console.error("Error cancelling assignment:", error);
      alert("Failed to unassign driver");
    }
  };

  const handleScheduleMaintenance = async (vehicleId, vehicleName) => {
    try {
      await axiosInstance.post(`/vehicles/${vehicleId}/maintenance`, {
        scheduledDate: new Date().toISOString(),
        notes: "Scheduled by manager",
      });
      alert(`Maintenance scheduled for ${vehicleName}`);
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      alert("Failed to schedule maintenance");
    }
  };

  const handleCreateTrip = () => {
    setShowTripModal(true);
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("role");
    dispatch({ type: actionTypes.LOGOUT });
    navigate("/login");
  };

  // Statistics
  const stats = {
    total: state.vehicles.length,
    available: state.vehicles.filter((v) => v.status === "Available").length,
    inUse: state.vehicles.filter((v) => v.status === "In Use").length,
    maintenance: state.vehicles.filter((v) => v.status === "Needs Maintenance")
      .length,
    activeTrips: trips.filter((t) => t.status === "active").length,
    totalDrivers: drivers.length,
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at ${backgroundX}% ${backgroundY}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at ${100 - backgroundX}% ${
            100 - backgroundY
          }%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%)
          `,
          zIndex: 1,
        }}
      />

      {/* Floating Orbs */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 2 }}
      >
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.15, 0.25, 0.15],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-orange-500/20 to-yellow-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-6 space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 relative z-50"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 mb-2">
                Fleet Manager Dashboard
              </h1>
              <p className="text-white/60 text-sm">
                Monitor operations and manage fleet assignments
              </p>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              {/* Create Trip Button */}
              {/* <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateTrip}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <span className="mr-2">🚀</span>
                Create Trip
              </motion.button> */}

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/manager/maintenance")}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <span className="mr-2">🔧</span>
                Maintenance Analytics
              </motion.button>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                {[
                  { mode: "analytics", icon: "📊", label: "Analytics" },
                  { mode: "grid", icon: "▦", label: "Grid" },
                  { mode: "map", icon: "🗺️", label: "Map" },
                  { mode: "bookings", icon: "📋", label: "Bookings" },
                  { mode: "maintenance", icon: "🔧", label: "Maintenance" },
                  {
                    mode: "ai-maintenance",
                    icon: "🤖",
                    label: "AI Predictions",
                  },
                ].map((item) => (
                  <motion.button
                    key={item.mode}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode(item.mode)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      viewMode === item.mode
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* User Menu */}
              <div className="relative z-[100]">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs text-white/60">Welcome</p>
                    <p className="text-sm font-bold text-white">{userRole}</p>
                  </div>
                  <motion.svg
                    animate={{ rotate: showUserMenu ? 180 : 0 }}
                    className="w-4 h-4 text-white/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90]"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                      >
                        <div className="p-4 border-b border-white/10">
                          <p className="text-sm font-semibold text-white truncate">
                            {userEmail}
                          </p>
                          <p className="text-xs text-white/60 mt-1">
                            {userRole}
                          </p>
                        </div>
                        <div className="p-2">
                          <motion.button
                            whileHover={{
                              x: 5,
                              backgroundColor: "rgba(239, 68, 68, 0.2)",
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowUserMenu(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-white rounded-xl transition-all"
                          >
                            <span className="text-xl">🚪</span>
                            <span className="font-semibold">Logout</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ✅ NEW: Critical Maintenance Alerts Banner */}
        {criticalVehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl"
                >
                  🚨
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-red-400">
                    {criticalVehicles.length} Critical Maintenance Alert
                    {criticalVehicles.length > 1 ? "s" : ""}
                  </h3>
                  <p className="text-red-300 text-sm mt-1">
                    {criticalVehicles.length} vehicle
                    {criticalVehicles.length > 1
                      ? "s require"
                      : " requires"}{" "}
                    immediate attention
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("ai-maintenance")}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-all"
              >
                View AI Analysis →
              </motion.button>
            </div>

            {/* Critical Vehicles Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {criticalVehicles.slice(0, 3).map((vehicle) => (
                <div
                  key={vehicle.vehicleId}
                  className="bg-red-500/20 border border-red-500/40 rounded-xl p-3"
                >
                  <p className="text-white font-bold text-sm">
                    Vehicle #{vehicle.vehicleId}
                  </p>
                  <p className="text-red-300 text-xs mt-1">{vehicle.message}</p>
                  <p className="text-red-400 text-xs mt-1">
                    ⏰ {vehicle.daysUntilMaintenance} days remaining
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Manager Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            {
              title: "Total Fleet",
              value: stats.total,
              icon: "🚗",
              bg: "from-blue-500/20 to-cyan-500/10",
            },
            {
              title: "Available",
              value: stats.available,
              icon: "✅",
              bg: "from-green-500/20 to-emerald-500/10",
            },
            {
              title: "In Use",
              value: stats.inUse,
              icon: "🚦",
              bg: "from-yellow-500/20 to-orange-500/10",
            },
            {
              title: "Maintenance",
              value: stats.maintenance,
              icon: "🔧",
              bg: "from-red-500/20 to-pink-500/10",
            },
            {
              title: "Active Trips",
              value: stats.activeTrips,
              icon: "🚀",
              bg: "from-purple-500/20 to-pink-500/10",
            },
            {
              title: "Total Drivers",
              value: stats.totalDrivers,
              icon: "👨‍✈️",
              bg: "from-orange-500/20 to-yellow-500/10",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative group"
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bg} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="text-3xl mb-3"
                >
                  {stat.icon}
                </motion.div>
                <h3 className="text-3xl font-black text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-white/60 text-sm font-semibold">
                  {stat.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter Bar */}
        {(viewMode === "grid" || viewMode === "list") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
          >
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder="🔍 Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl focus:outline-none focus:border-purple-500 placeholder-white/50 transition-all"
                />
              </div>
              <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                {[
                  { value: "all", label: "All" },
                  { value: "available", label: "Available" },
                  { value: "inuse", label: "In Use" },
                  { value: "needsmaintenance", label: "Maintenance" },
                ].map((filter) => (
                  <motion.button
                    key={filter.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilterStatus(filter.value)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      filterStatus === filter.value
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {viewMode === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VehicleDashboardKPIs />
            </motion.div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {state.vehicles?.map((vehicle, index) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <VehicleCard
                      key={`vehicle-${vehicle.id}-${vehicle.assignedDriverId}`}
                      vehicle={vehicle}
                      onEdit={handleEditVehicle}
                      onDelete={handleDeleteVehicle}
                      onAssign={handleAssignDriver} // ✅ ADD
                      onUnassign={handleUnassignDriver} // ✅ ADD
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {viewMode === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FleetMap
                vehicles={state.vehicles}
                height="calc(100vh - 400px)"
                showControls={true}
                showLegend={true}
                defaultStyle="dark"
              />
            </motion.div>
          )}

          {viewMode === "trips" && (
            <motion.div
              key="trips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Active Trips
              </h2>
              {trips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-white/60">No active trips</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {trip.vehicleName}
                          </h3>
                          <p className="text-sm text-white/60">
                            {trip.driverName}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                          {trip.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {viewMode === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BookingManager />
            </motion.div>
          )}

          {viewMode === "optimizer" && (
            <motion.div
              key="optimizer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <RouteForm
                    onCreated={(r) => {
                      dispatch({ type: actionTypes.UPDATE_ROUTE, payload: r });
                      loadRoutes();
                    }}
                  />
                </div>

                <div className="lg:col-span-2">
                  <RouteList routes={state.routes} onUpdated={loadRoutes} />
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Route Map
                </h2>
                <RouteMap
                  routes={state.routes}
                  vehicles={state.vehicles}
                  height="600px"
                />
              </div>
            </motion.div>
          )}

          {/* viewMode === "maintenance" */}
          {viewMode === "maintenance" && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Combined KPI Cards - AI Predictions + Manual Tickets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    title: "AI Critical",
                    value: predictions.filter((p) => p.status === "Critical")
                      .length,
                    icon: "🤖",
                    bg: "from-red-500/20 to-pink-500/10",
                    description: "AI Detected",
                  },
                  {
                    title: "AI Due Soon",
                    value: predictions.filter((p) => p.status === "Due").length,
                    icon: "⚠️",
                    bg: "from-orange-500/20 to-yellow-500/10",
                    description: "Needs Service",
                  },
                  {
                    title: "AI Healthy",
                    value: predictions.filter((p) => p.status === "Healthy")
                      .length,
                    icon: "✅",
                    bg: "from-green-500/20 to-emerald-500/10",
                    description: "Good Condition",
                  },
                  {
                    title: "Open Tickets",
                    value: maintenanceTickets.filter((t) => t.status === "OPEN")
                      .length,
                    icon: "🎫",
                    bg: "from-blue-500/20 to-cyan-500/10",
                    description: "Manual Reports",
                  },
                  {
                    title: "High Priority",
                    value: maintenanceTickets.filter(
                      (t) => t.severity === "HIGH" && t.status === "OPEN"
                    ).length,
                    icon: "🚨",
                    bg: "from-purple-500/20 to-pink-500/10",
                    description: "Urgent Issues",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="relative group"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${stat.bg} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        className="text-3xl mb-3"
                      >
                        {stat.icon}
                      </motion.div>
                      <h3 className="text-3xl font-black text-white mb-1">
                        {stat.value}
                      </h3>
                      <p className="text-white/60 text-sm font-semibold">
                        {stat.title}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {stat.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Predictions Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  🤖 AI Maintenance Predictions
                  <span className="text-sm font-normal text-white/60">
                    ({predictions.length} vehicles analyzed)
                  </span>
                </h2>

                {predictions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤖</div>
                    <p className="text-white/60">No AI predictions available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                            Vehicle
                          </th>
                          <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                            Health Score
                          </th>
                          <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                            Next Service
                          </th>
                          <th className="px-4 py-3 text-left text-white/80 text-sm font-semibold">
                            Days Remaining
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions
                          .sort((a, b) => {
                            // Sort: Critical → Due → Healthy
                            const order = { Critical: 3, Due: 2, Healthy: 1 };
                            return (
                              (order[b.status] || 0) - (order[a.status] || 0)
                            );
                          })
                          .map((pred, index) => (
                            <motion.tr
                              key={pred.vehicleId}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="border-b border-white/5 hover:bg-white/5 transition-all"
                            >
                              <td className="px-4 py-3 text-white font-semibold">
                                Vehicle #{pred.vehicleId}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    pred.status === "Critical"
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                      : pred.status === "Due"
                                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                                  }`}
                                >
                                  {pred.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-[100px]">
                                    <div
                                      className={`h-full ${
                                        pred.healthScore >= 80
                                          ? "bg-green-500"
                                          : pred.healthScore >= 60
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{ width: `${pred.healthScore}%` }}
                                    />
                                  </div>
                                  <span className="text-white text-sm font-bold w-12">
                                    {pred.healthScore}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-white/80 text-sm">
                                {pred.nextMaintenanceDate
                                  ? new Date(
                                      pred.nextMaintenanceDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`font-bold ${
                                    pred.daysUntilMaintenance <= 3
                                      ? "text-red-400"
                                      : pred.daysUntilMaintenance <= 14
                                      ? "text-orange-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  {pred.daysUntilMaintenance} days
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>

              {/* Charts & Manual Tickets Section */}
              {/* Charts & Manual Tickets Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Maintenance Charts - Combined AI + Manual */}
                <div className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    📊 Combined Maintenance Analytics
                    <span className="text-sm font-normal text-white/60 ml-2">
                      (AI Predictions + Manual Reports)
                    </span>
                  </h2>

                  {/* Show breakdown */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-xs font-semibold mb-1">
                        Critical
                      </p>
                      <p className="text-white text-lg font-bold">
                        {
                          predictions.filter((p) => p.status === "Critical")
                            .length
                        }{" "}
                        AI +{" "}
                        {
                          maintenanceTickets.filter(
                            (t) => t.severity === "HIGH" && t.status === "OPEN"
                          ).length
                        }{" "}
                        Manual
                      </p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <p className="text-orange-400 text-xs font-semibold mb-1">
                        Warning
                      </p>
                      <p className="text-white text-lg font-bold">
                        {predictions.filter((p) => p.status === "Due").length}{" "}
                        AI +{" "}
                        {
                          maintenanceTickets.filter(
                            (t) =>
                              t.severity === "MEDIUM" && t.status === "OPEN"
                          ).length
                        }{" "}
                        Manual
                      </p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-400 text-xs font-semibold mb-1">
                        Good
                      </p>
                      <p className="text-white text-lg font-bold">
                        {
                          predictions.filter((p) => p.status === "Healthy")
                            .length
                        }{" "}
                        AI +{" "}
                        {
                          maintenanceTickets.filter(
                            (t) => t.severity === "LOW" && t.status === "OPEN"
                          ).length
                        }{" "}
                        Manual
                      </p>
                    </div>
                  </div>

                  <MaintenanceCharts
                    stats={{
                      critical:
                        predictions.filter((p) => p.status === "Critical")
                          .length +
                        maintenanceTickets.filter(
                          (t) => t.severity === "HIGH" && t.status === "OPEN"
                        ).length,
                      high:
                        predictions.filter((p) => p.status === "Due").length +
                        maintenanceTickets.filter(
                          (t) => t.severity === "MEDIUM" && t.status === "OPEN"
                        ).length,
                      medium:
                        predictions.filter((p) => p.status === "Healthy")
                          .length +
                        maintenanceTickets.filter(
                          (t) => t.severity === "LOW" && t.status === "OPEN"
                        ).length,
                      total:
                        predictions.length +
                        maintenanceTickets.filter((t) => t.status === "OPEN")
                          .length,
                    }}
                  />
                </div>

                {/* Manual Maintenance Tickets List */}
                {/* Manual Maintenance Tickets List */}
                <div className="lg:col-span-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-between">
                    <span>🎫 Manual Reports</span>
                    {/* ✅ CORRECT - Only count manual tickets (exclude AUTO) */}
                    <span className="text-sm font-normal text-white/60">
                      (
                      {
                        maintenanceTickets.filter(
                          (t) =>
                            t.status === "OPEN" &&
                            !t.description?.startsWith("AUTO:")
                        ).length
                      }
                      )
                    </span>
                  </h2>

                  <AlertsTable
                    tickets={maintenanceTickets.filter(
                      (t) => t.status === "OPEN"
                    )}
                    onTicketUpdated={(updatedTicket) => {
                      setMaintenanceTickets((prev) =>
                        prev.filter((t) => t.id !== updatedTicket.id)
                      );
                    }}
                  />
                </div>
              </div>

              {/* ✅ REMOVED: Vehicle Health Cards section */}
            </motion.div>
          )}

          {/* ✅ NEW: AI Maintenance Prediction View */}
          {viewMode === "ai-maintenance" && (
            <motion.div
              key="ai-maintenance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIMaintenanceDashboard />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {filteredVehicles.length === 0 && viewMode === "grid" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center"
          >
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Vehicles Found
            </h3>
            <p className="text-white/60">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "No vehicles available in the fleet"}
            </p>
          </motion.div>
        )}
      </div>

      {/* Vehicle Details Modal (Read-only) */}
      {showModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Vehicle Details
              </h2>
              {selectedVehicle && (
                <div className="space-y-4">
                  <div>
                    <p className="text-white/60 text-sm">Name</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Status</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Battery</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.batteryLevel}%
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Fuel</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.fuelLevel}%
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Speed</p>
                    <p className="text-white font-semibold">
                      {selectedVehicle.speed} km/h
                    </p>
                  </div>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(false)}
                className="w-full mt-6 px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Assign Driver Modal */}
      {/* Assign Driver Modal */}
      {showAssignModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                👤 Assign Driver
              </h2>
              {selectedForAssignment && (
                <>
                  <p className="text-white/70 mb-4">
                    Vehicle:{" "}
                    <span className="font-bold text-white">
                      {selectedForAssignment.name}
                    </span>
                  </p>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-purple-500 mb-6"
                  >
                    <option value="" className="bg-gray-800">
                      Select a driver...
                    </option>
                    {drivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                        className="bg-gray-800"
                      >
                        {driver.fullName ||
                          driver.email ||
                          `Driver #${driver.id}`}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowAssignModal(false);
                        setSelectedForAssignment(null);
                        setSelectedDriver("");
                      }}
                      className="flex-1 px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        handleSubmitAssignment(
                          selectedForAssignment.id,
                          parseInt(selectedDriver)
                        )
                      }
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      ✅ Assign
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 max-w-md w-full"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex justify-center mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-4xl shadow-lg">
                  🚪
                </div>
              </motion.div>
              <h2 className="text-2xl font-black text-white text-center mb-3">
                Logout?
              </h2>
              <p className="text-white/70 text-center mb-8">
                Are you sure you want to logout? You will need to login again to
                access the dashboard.
              </p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmLogout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;
