import React, { useEffect, useState, useRef } from "react";
import { useGlobalState, actionTypes } from "../../context/GlobalState.jsx";
import { connectWebSocket } from "../../api/wsClient";
import { fetchDriverVehicle } from "../../api/vehicleApi";
import routeApi from "../../api/routeApi";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import FleetMap from "../map/FleetMap.jsx";
import {
  connectRouteSocket,
  disconnectRouteSocket,
} from "../../utils/wsRoutes";

import maintenanceApi from "../../api/maintenanceApi.js";
import VehicleHealthCard from "../maintenance/VehicleHealthCard.jsx";

import bookingApi from "../../api/bookingApi.js";

import DriverRouteDashboard from "../Route/DriverRouteDashboard.jsx";
import PredictiveMaintenancePanel from "../maintenance/PredictiveMaintenancePanel";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";

const DriverDashboard = () => {
  const { state, dispatch } = useGlobalState();
  const navigate = useNavigate();

  // State management
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tripStatus, setTripStatus] = useState("idle");
  const [currentTrip, setCurrentTrip] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [viewMode, setViewMode] = useState("vehicle"); // vehicle, routes
  const [driverRoutes, setDriverRoutes] = useState([]);

  const canvasRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // User info
  const userRole = localStorage.getItem("role") || "DRIVER";
  const userEmail = state.user?.username || "driver@neurofleetx.com";
  const userId = state.user?.id || localStorage.getItem("userId");

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceIssue, setMaintenanceIssue] = useState("");
  const [maintenanceSeverity, setMaintenanceSeverity] = useState("MEDIUM");
  const [maintenanceDescription, setMaintenanceDescription] = useState("");
  const [myMaintenanceTickets, setMyMaintenanceTickets] = useState([]);

  // ✅ KEEP ONLY THESE STATE DECLARATIONS
  const [driverBookings, setDriverBookings] = useState([]);
  const [loadingBookingAction, setLoadingBookingAction] = useState(null);
  const [showBookingRejectModal, setShowBookingRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingRejectReason, setBookingRejectReason] = useState("");

  const [vehiclePrediction, setVehiclePrediction] = useState(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);

  const [confirmedBookings, setConfirmedBookings] = useState([]);

  // ✅ REMOVE THE DUPLICATE const [pendingBookings, setPendingBookings] = useState([]);

  // ✅ Keep these computed values (NOT state, just useMemo/filter)
  const pendingBookings = driverBookings.filter((b) => b.status === "PENDING");
  const acceptedBookings = driverBookings.filter(
    (b) => b.status === "CONFIRMED"
  );

  // ✅ Helper function to safely get vehicle type name
  const getVehicleTypeName = (vehicleType) => {
    if (!vehicleType) return "Unknown";
    if (typeof vehicleType === "string") return vehicleType;
    if (typeof vehicleType === "object" && vehicleType.name)
      return vehicleType.name;
    return "Unknown";
  };

  // Find assigned vehicle
  const assignedVehicle = React.useMemo(
    () => state.vehicles[0] || null,
    [state.vehicles]
  );

  // Helper function to safely get status name
  const getStatusName = (status) => {
    if (!status) return "Unknown";
    if (typeof status === "string") return status;
    if (typeof status === "object" && status?.name) return status.name;
    return "Unknown";
  };

  // ✅ FIXED - Extract vehicle type name properly
  // ✅ COMPLETELY FIXED - Ensures ONLY strings, never objects
  const driverVehicleTypes = React.useMemo(() => {
    const extractVehicleTypeName = (vType) => {
      if (!vType) return "Car";
      if (typeof vType === "string") return vType;
      if (typeof vType === "object" && vType?.name) return String(vType.name);
      // Fallback: convert to string
      return String(vType);
    };

    if (assignedVehicle) {
      const vehicleType = assignedVehicle.type || assignedVehicle.vehicleType;
      const typeName = extractVehicleTypeName(vehicleType);
      console.log("Extracted vehicle type:", typeName); // Debug log
      return [typeName];
    }

    // Ensure user types are also strings
    const userTypes = state.user?.assignedVehicleTypes || ["Car"];
    const extracted = userTypes.map((vt) => extractVehicleTypeName(vt));
    console.log("Extracted user vehicle types:", extracted); // Debug log
    return extracted;
  }, [assignedVehicle, state.user]);

  console.log("🔍 DEBUG - driverVehicleTypes:", driverVehicleTypes);
  console.log("🔍 DEBUG - assignedVehicle:", assignedVehicle);
  console.log("🔍 DEBUG - driverBookings:", driverBookings);

  // Load maintenance tickets reported by this driver
  // Load maintenance tickets reported by this driver
  useEffect(() => {
    const loadMyTickets = async () => {
      try {
        const response = await maintenanceApi.getMyTickets();
        setMyMaintenanceTickets(response.data || []);
      } catch (error) {
        console.error("Error loading tickets:", error);
        setMyMaintenanceTickets([]);
      }
    };

    loadMyTickets();
  }, []);

  // ✅ NEW: Load AI prediction for driver's assigned vehicle
  useEffect(() => {
    if (assignedVehicle?.id) {
      loadVehiclePrediction(assignedVehicle.id);
    }
  }, [assignedVehicle]);

  const loadVehiclePrediction = async (vehicleId) => {
    try {
      console.log("🤖 Loading AI prediction for vehicle:", vehicleId);
      const prediction = await maintenanceApi.getPrediction(vehicleId);
      setVehiclePrediction(prediction);
      console.log("✅ Prediction loaded:", prediction);
    } catch (error) {
      console.error("❌ Error loading vehicle prediction:", error);
      setVehiclePrediction(null);
    }
  };

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

  // Add after the existing useEffect hooks (around line 180)
  useEffect(() => {
    loadDriverBookings();

    // Poll for new bookings every 15 seconds
    const interval = setInterval(loadDriverBookings, 15000);
    return () => clearInterval(interval);
  }, [userId, driverVehicleTypes]);

  // Inside DriverDashboard.jsx - Replace the booking loading section:

  // ✅ CORRECT VERSION - Just set driverBookings
  const loadDriverBookings = async () => {
    try {
      console.log("📋 Loading driver bookings...");

      // ✅ Get pending bookings
      let pending = [];
      try {
        const pendingRes = await bookingApi.getPendingBookings();
        pending = Array.isArray(pendingRes)
          ? pendingRes
          : pendingRes.data || [];
        console.log("📋 Pending bookings:", pending);
      } catch (error) {
        console.error("❌ Error loading pending bookings:", error);
      }

      // ✅ Get confirmed bookings
      let confirmed = [];
      try {
        const confirmedRes = await bookingApi.getConfirmedBookings();
        confirmed = Array.isArray(confirmedRes)
          ? confirmedRes
          : confirmedRes.data || [];
        console.log("✅ Confirmed bookings:", confirmed);
      } catch (error) {
        console.error("❌ Error loading confirmed bookings:", error);
      }

      // ✅ MERGE BOTH into driverBookings
      const allBookings = [...pending, ...confirmed];
      setDriverBookings(allBookings);
      console.log("🎯 All bookings merged:", allBookings);
    } catch (error) {
      console.error("❌ Error loading driver bookings:", error);
      setDriverBookings([]);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    // ✅ Changed parameter
    try {
      setLoadingBookingAction(bookingId);

      // ✅ Use corrected API call (no driverId in body)
      const res = await bookingApi.acceptBooking(bookingId);

      console.log("✅ Booking accepted:", res);

      // ✅ Reload bookings immediately
      await loadDriverBookings();

      alert("✅ Booking accepted successfully!");
    } catch (err) {
      console.error("Error accepting booking:", err);
      alert(
        "Failed to accept booking: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoadingBookingAction(null);
    }
  };

  const handleRejectBookingClick = (booking) => {
    setSelectedBooking(booking);
    setShowBookingRejectModal(true);
  };

  const confirmRejectBooking = async () => {
    if (!bookingRejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setLoadingBookingAction(selectedBooking.id);

      // ✅ FIXED: Only pass bookingId and reason (no driverId)
      const res = await bookingApi.rejectBooking(
        selectedBooking.id,
        bookingRejectReason
      );

      console.log("❌ Booking rejected:", res);
      alert("❌ Booking rejected. It will be offered to other drivers.");

      setShowBookingRejectModal(false);
      setSelectedBooking(null);
      setBookingRejectReason("");

      // ✅ Reload bookings
      await loadDriverBookings();
    } catch (err) {
      console.error("Error rejecting booking:", err);
      alert(
        "Failed to reject booking: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoadingBookingAction(null);
    }
  };

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

  // Load vehicles and routes
  // Load vehicles and routes
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("📍 Loading driver data...");

        // ✅ FIXED: Fetch vehicle assigned to THIS driver
        const vehicle = await fetchDriverVehicle(userId); // ✅ Pass userId

        console.log("🚗 Fetched vehicle:", vehicle);

        if (vehicle && vehicle.id) {
          // ✅ IMPORTANT: Set vehicles in state
          dispatch({
            type: actionTypes.SET_VEHICLES,
            payload: [vehicle],
          });
          console.log("✅ Vehicle set to state:", vehicle);
        } else {
          console.log("⚠️ No vehicle assigned to this driver");
          dispatch({
            type: actionTypes.SET_VEHICLES,
            payload: [],
          });
        }

        // ✅ Fetch driver's routes
        try {
          if (userId) {
            const routesRes = await routeApi.getDriverRoutes(userId);
            const routes = Array.isArray(routesRes.data)
              ? routesRes.data
              : routesRes.data
              ? [routesRes.data]
              : [];
            setDriverRoutes(routes);
            dispatch({ type: actionTypes.SET_ROUTES, payload: routes });
          }
        } catch (routeError) {
          console.error("Error loading routes:", routeError);
          setDriverRoutes([]);
        }
      } catch (error) {
        console.error("❌ Error loading driver data:", error);
        dispatch({ type: actionTypes.SET_VEHICLES, payload: [] });
        setDriverRoutes([]);
      }
    };

    // ✅ Call loadData when userId is available
    if (userId) {
      loadData();
    }

    // ✅ Reconnect WebSocket
    connectWebSocket((data) =>
      dispatch({ type: actionTypes.UPDATE_TELEMETRY, payload: data })
    );

    // ✅ WebSocket for route updates
    if (typeof connectRouteSocket === "function") {
      connectRouteSocket((data) => {
        if (data.assignedDriverId === userId || data.driverId === userId) {
          setDriverRoutes((prev) => {
            const exists = prev.some((r) => r.id === data.id);
            if (exists) {
              return prev.map((r) => (r.id === data.id ? data : r));
            }
            return [data, ...prev];
          });
        }
      });
    }

    return () => {
      if (typeof disconnectRouteSocket === "function") {
        disconnectRouteSocket();
      }
    };
  }, [dispatch, userId]); // ✅ ADD userId as dependency

  // Load route data from web socket
  useEffect(() => {
    connectWebSocket((routeUpdate) => {
      if (routeUpdate.driver?.id === state.user.id) {
        dispatch({ type: actionTypes.UPDATE_ROUTE, payload: routeUpdate });
      }
    });
  }, [dispatch, state.user.id]);

  // Driver Operations
  const handleStartTrip = async () => {
    try {
      const response = await axiosInstance.post("/trips/start", {
        vehicleId: assignedVehicle.id,
        driverId: userId,
      });
      setCurrentTrip(response.data);
      setTripStatus("started");
      alert("Trip started successfully!");
    } catch (error) {
      console.error("Error starting trip:", error);
      alert("Failed to start trip");
    }
  };

  const handleEndTrip = async () => {
    try {
      await axiosInstance.post(`/trips/${currentTrip.id}/end`);
      setTripStatus("ended");
      setCurrentTrip(null);
      alert("Trip ended successfully!");
    } catch (error) {
      console.error("Error ending trip:", error);
      alert("Failed to end trip");
    }
  };

  const handleReportIssue = () => {
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportType || !reportDescription) {
      alert("Please fill all fields");
      return;
    }

    try {
      await axiosInstance.post("/reports", {
        vehicleId: assignedVehicle.id,
        driverId: userId,
        type: reportType,
        description: reportDescription,
      });
      alert("Issue reported successfully!");
      setShowReportModal(false);
      setReportType("");
      setReportDescription("");
    } catch (error) {
      console.error("Error reporting issue:", error);
      alert("Failed to report issue");
    }
  };

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    dispatch({ type: actionTypes.LOGOUT });
    navigate("/login");
  };

  // Add these handler functions before the return statement

  const handleStartRoute = async (routeId) => {
    try {
      await routeApi.updateRouteStatus(routeId, "IN_PROGRESS");

      // Update local state
      setDriverRoutes((prev) =>
        prev.map((r) =>
          r.id === routeId ? { ...r, status: "IN_PROGRESS" } : r
        )
      );

      alert("Route started successfully!");
    } catch (err) {
      console.error("Error starting route:", err);
      alert("Failed to start route");
    }
  };

  const handleCompleteRoute = async (routeId) => {
    if (!window.confirm("Mark this route as completed?")) return;

    try {
      await routeApi.updateRouteStatus(routeId, "COMPLETED");

      // Update local state
      setDriverRoutes((prev) =>
        prev.map((r) => (r.id === routeId ? { ...r, status: "COMPLETED" } : r))
      );

      alert("Route completed successfully!");
    } catch (err) {
      console.error("Error completing route:", err);
      alert("Failed to complete route");
    }
  };

  const handleSubmitMaintenance = async () => {
    if (!maintenanceIssue || !maintenanceDescription) {
      alert("Please fill all required fields");
      return;
    }

    if (!assignedVehicle) {
      alert("No vehicle assigned");
      return;
    }

    try {
      // ✅ FIXED: Use driver-specific endpoint
      await maintenanceApi.reportIssueAsDriver({
        vehicleId: assignedVehicle.id,
        description: maintenanceDescription,
        severity: maintenanceSeverity,
      });

      alert("Maintenance issue reported successfully!");

      // Refresh tickets
      const response = await maintenanceApi.getMyTickets();
      setMyMaintenanceTickets(response.data || []);

      // Reset form
      setShowMaintenanceModal(false);
      setMaintenanceIssue("");
      setMaintenanceDescription("");
      setMaintenanceSeverity("MEDIUM");
    } catch (error) {
      console.error("Error reporting maintenance:", error);
      alert("Failed to report maintenance issue");
    }
  };

  // Filter routes for this driver
  const myRoutes = driverRoutes.filter((r) => r.driverId === userId);

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
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.15, 0.25, 0.15],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
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
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 mb-2">
                Driver Dashboard
              </h1>
              <p className="text-white/60 text-sm">
                Manage your assigned vehicle and trips
              </p>
            </div>

            <div className="flex gap-3 items-center">
              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                {[
                  { mode: "vehicle", icon: "🚗", label: "Vehicle" },
                  { mode: "bookings", icon: "📋", label: "Bookings" },
                  { mode: "routes", icon: "🗺️", label: "Routes" },
                  { mode: "maintenance", icon: "🔧", label: "Maintenance" },
                  { mode: "health", icon: "❤️", label: "Health" },
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

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/customer/route-optimization")}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <span className="mr-2">🗺️</span>
                Route Optimizer
              </motion.button>

              {/* User Menu */}
              <div className="relative z-[100]">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
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

        <AnimatePresence mode="wait">
          {viewMode === "vehicle" && assignedVehicle ? (
            <motion.div
              key="vehicle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Vehicle Information Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    🚗 {assignedVehicle.name}
                  </h2>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold ${
                      getStatusName(assignedVehicle.status) === "Available"
                        ? "bg-green-500/20 text-green-400"
                        : getStatusName(assignedVehicle.status) === "In Use"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {getStatusName(assignedVehicle.status)}
                  </span>
                </div>

                {/* Real-time Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white/60 text-sm mb-1">Speed</p>
                    <p className="text-2xl font-bold text-white">
                      {assignedVehicle.speed?.toFixed(1) || "0.0"} km/h
                    </p>
                  </div>
                  <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white/60 text-sm mb-1">Battery</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(assignedVehicle.batteryLevel || 0)}%
                    </p>
                  </div>
                  <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white/60 text-sm mb-1">Fuel</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(assignedVehicle.fuelLevel || 0)}%
                    </p>
                  </div>
                  <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white/60 text-sm mb-1">Location</p>
                    <p className="text-sm font-bold text-white">
                      {assignedVehicle.latitude?.toFixed(2)},{" "}
                      {assignedVehicle.longitude?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 flex-wrap">
                  {tripStatus === "idle" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartTrip}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <span className="mr-2">▶️</span>
                      Start Trip
                    </motion.button>
                  )}

                  {tripStatus === "started" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEndTrip}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <span className="mr-2">⏹️</span>
                      End Trip
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReportIssue}
                    className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                  >
                    <span className="mr-2">⚠️</span>
                    Report Issue
                  </motion.button>
                </div>
              </motion.div>

              {/* Trip Status */}
              {tripStatus === "started" && currentTrip && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-xl bg-green-500/10 border border-green-500/30 rounded-3xl p-6 mt-6"
                >
                  <h3 className="text-xl font-bold text-green-400 mb-4">
                    🚀 Trip in Progress
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/60 text-sm">Trip ID</p>
                      <p className="text-white font-semibold">
                        #{currentTrip.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Started At</p>
                      <p className="text-white font-semibold">
                        {new Date(currentTrip.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : viewMode === "vehicle" && !assignedVehicle ? (
            <motion.div
              key="no-vehicle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center"
            >
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                No Vehicle Assigned
              </h3>
              <p className="text-white/60">
                Please contact your manager to get a vehicle assigned
              </p>
            </motion.div>
          ) : null}

          {viewMode === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Pending Booking Requests */}
              <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                      📋 New Booking Requests
                    </h2>
                    <p className="text-white60 text-sm mt-1">
                      {/* ✅ FINAL FIX - Force convert everything to string */}
                      Bookings for{" "}
                      {Array.isArray(driverVehicleTypes)
                        ? driverVehicleTypes.map((vt) => String(vt)).join(", ")
                        : "your"}{" "}
                      vehicles
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadDriverBookings}
                    className="px-4 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                  >
                    🔄 Refresh
                  </motion.button>
                </div>

                {/* Filter pending bookings for driver's vehicle types */}
                {(() => {
                  // ✅ FIXED - Line 676
                  const pendingBookings = driverBookings.filter(
                    (b) =>
                      b.status === "PENDING" &&
                      driverVehicleTypes.some((vt) => {
                        // Get the actual vehicle type name from booking
                        const bookingVehicleType =
                          typeof b.vehicleType === "string"
                            ? b.vehicleType
                            : b.vehicleType?.name;

                        return vt === bookingVehicleType;
                      }) &&
                      !b.assignedDriverId
                  );

                  return pendingBookings.length === 0 ? (
                    <div className="text-center py-12 backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl">
                      <div className="text-6xl mb-4">📭</div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        No New Requests
                      </h3>
                      <p className="text-white/60">
                        New bookings for{" "}
                        {driverVehicleTypes.map((vt) => String(vt)).join(", ")}
                        vehicles will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingBookings.map((booking, index) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
                        >
                          <div className="flex flex-col lg:flex-row justify-between gap-4">
                            {/* Booking Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <h3 className="text-lg font-bold text-white">
                                  🚗 {getVehicleTypeName(booking.vehicleType)}{" "}
                                  Booking
                                </h3>
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold animate-pulse">
                                  NEW REQUEST
                                </span>
                                <span className="text-sm text-white/60">
                                  Booking #{booking.id}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-white/50 min-w-[80px]">
                                      📍 Pickup:
                                    </span>
                                    <span className="font-semibold text-white">
                                      {booking.pickupLocation}
                                    </span>
                                  </div>
                                  {booking.dropoffLocation && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/50 min-w-[80px]">
                                        🎯 Dropoff:
                                      </span>
                                      <span className="font-semibold text-white">
                                        {booking.dropoffLocation}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-2">
                                    <span className="text-white/50 min-w-[80px]">
                                      👤 Customer:
                                    </span>
                                    <span className="font-semibold text-white">
                                      ID #{booking.customerId}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-white/50 min-w-[80px]">
                                      🕐 Start:
                                    </span>
                                    <span className="font-semibold text-white">
                                      {new Date(
                                        booking.startTime
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-white/50 min-w-[80px]">
                                      🕑 End:
                                    </span>
                                    <span className="font-semibold text-white">
                                      {new Date(
                                        booking.endTime
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  {booking.seats && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-white/50 min-w-[80px]">
                                        👥 Seats:
                                      </span>
                                      <span className="font-semibold text-white">
                                        {booking.seats}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex lg:flex-col gap-3 lg:min-w-[150px]">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAcceptBooking(booking.id)}
                                disabled={loadingBookingAction === booking.id}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loadingBookingAction === booking.id
                                  ? "⏳ Processing..."
                                  : "✅ Accept"}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleRejectBookingClick(booking)
                                }
                                disabled={loadingBookingAction === booking.id}
                                className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
                              >
                                ❌ Reject
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>

              {/* My Accepted Bookings */}
              {/* My Accepted Bookings */}
              <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  ✅ My Accepted Bookings
                </h2>

                {(() => {
                  return acceptedBookings.length === 0 ? ( // ✅ ADD RETURN HERE
                    <div className="text-center py-8 backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-white/60">No accepted bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {acceptedBookings.map((booking, index) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="backdrop-blur-sm bg-green-500/10 border border-green-500/30 rounded-xl p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">
                                  🚗 {getVehicleTypeName(booking.vehicleType)}{" "}
                                  Booking
                                </h3>
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">
                                  CONFIRMED
                                </span>
                                {booking.isPaid && (
                                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                                    ✅ Paid
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-white/70">
                                <div>📍 {booking.pickupLocation}</div>
                                {booking.dropoffLocation && (
                                  <div>🎯 {booking.dropoffLocation}</div>
                                )}
                                <div>
                                  🕐{" "}
                                  {new Date(booking.startTime).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/50">
                                Booking #{booking.id}
                              </p>
                              <p className="text-xs text-white/50">
                                Customer #{booking.customerId}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}

          {/* ✅ ROUTES VIEW - NEW INTEGRATION */}
          {viewMode === "routes" && (
            <motion.div
              key="routes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <DriverRouteDashboard />
            </motion.div>
          )}

          {viewMode === "maintenance" && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Report Maintenance Card */}
              <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    🔧 Maintenance Reports
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMaintenanceModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <span className="mr-2">⚠️</span>
                    Report Issue
                  </motion.button>
                </div>

                {/* My Tickets */}
                {myMaintenanceTickets.length === 0 ? (
                  <div className="text-center py-12 backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-white/60">
                      No maintenance issues reported
                    </p>
                    <p className="text-white/40 text-sm mt-1">
                      Vehicle is in good condition
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myMaintenanceTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`backdrop-blur-sm bg-white/5 border rounded-xl p-6 ${
                          ticket.severity === "HIGH"
                            ? "border-red-500/50"
                            : ticket.severity === "MEDIUM"
                            ? "border-yellow-500/50"
                            : "border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-bold text-lg">
                                {ticket.issue}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  ticket.severity === "HIGH"
                                    ? "bg-red-500/20 text-red-400"
                                    : ticket.severity === "MEDIUM"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-blue-500/20 text-blue-400"
                                }`}
                              >
                                {ticket.severity}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  ticket.status === "OPEN"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : ticket.status === "IN_PROGRESS"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-white/60 text-sm">
                              Ticket #{ticket.id}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-white/80 text-sm mb-2">
                            <span className="text-white/40">Description: </span>
                            {ticket.description}
                          </p>
                          {ticket.notes && (
                            <p className="text-white/60 text-xs mt-2">
                              <span className="text-white/40">
                                Manager Notes:{" "}
                              </span>
                              {ticket.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/10">
                          <span>
                            📅 {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                          {ticket.resolvedAt && (
                            <span>
                              ✅ Resolved:{" "}
                              {new Date(ticket.resolvedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ✅ SIMPLIFIED AI HEALTH PREDICTION BUTTON */}
          {viewMode === "health" && assignedVehicle && (
            <motion.div
              key="health"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* AI Health Prediction Button */}
              {vehiclePrediction?.data ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPredictionModal(true)}
                  className={`w-full backdrop-blur-xl border rounded-3xl p-8 text-left transition-all ${
                    vehiclePrediction.data.status === "Critical"
                      ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                      : vehiclePrediction.data.status === "Due"
                      ? "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50"
                      : "bg-green-500/10 border-green-500/30 hover:border-green-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">
                        {vehiclePrediction.data.status === "Critical"
                          ? "🚨"
                          : vehiclePrediction.data.status === "Due"
                          ? "⚠️"
                          : "✅"}
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">
                          🤖 AI Health Prediction
                        </h3>
                        <p className="text-white/60">
                          Click to view detailed AI analysis and recommendations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-6 py-3 rounded-full text-lg font-bold ${
                          vehiclePrediction.data.status === "Critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : vehiclePrediction.data.status === "Due"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-green-500/20 text-green-400 border border-green-500/30"
                        }`}
                      >
                        {vehiclePrediction.data.status}
                      </span>
                      <svg
                        className="w-8 h-8 text-white/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 text-center"
                >
                  <div className="text-6xl mb-4">🔄</div>
                  <p className="text-white/60">
                    Loading AI health prediction...
                  </p>
                </motion.div>
              )}

              {/* Original Vehicle Health Card */}
              <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Real-Time Metrics
                </h2>
                <VehicleHealthCard vehicle={assignedVehicle} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Maintenance Report Modal */}
      {showMaintenanceModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMaintenanceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl">
                  🔧
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Report Maintenance Issue
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2 font-semibold">
                    Vehicle
                  </label>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white font-semibold">
                      {assignedVehicle?.name || "No vehicle assigned"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2 font-semibold">
                    Issue Type <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={maintenanceIssue}
                    onChange={(e) => setMaintenanceIssue(e.target.value)}
                    className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-orange-500 placeholder-white/40"
                    placeholder="e.g., Engine overheating, Brake failure"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2 font-semibold">
                    Severity <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={maintenanceSeverity}
                    onChange={(e) => setMaintenanceSeverity(e.target.value)}
                    className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-orange-500"
                  >
                    <option value="LOW" className="bg-gray-800">
                      Low Priority
                    </option>
                    <option value="MEDIUM" className="bg-gray-800">
                      Medium Priority
                    </option>
                    <option value="HIGH" className="bg-gray-800">
                      High Priority (Urgent)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2 font-semibold">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={maintenanceDescription}
                    onChange={(e) => setMaintenanceDescription(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-orange-500 resize-none placeholder-white/40"
                    placeholder="Describe the issue in detail..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    setMaintenanceIssue("");
                    setMaintenanceDescription("");
                    setMaintenanceSeverity("MEDIUM");
                  }}
                  className="flex-1 px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitMaintenance}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Submit Report
                </motion.button>
              </div>
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
                Are you sure you want to logout?
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

      {/* 👇 ADD BOOKING REJECT MODAL HERE 👇 */}
      {/* Booking Reject Modal */}
      <AnimatePresence>
        {showBookingRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBookingRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 max-w-md w-full"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex justify-center mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-4xl shadow-lg">
                  ❌
                </div>
              </motion.div>

              <h2 className="text-2xl font-black text-white text-center mb-3">
                Reject Booking?
              </h2>
              <p className="text-white70 text-center mb-6">
                {/* ✅ FIXED - Access .name property */}
                Booking #{selectedBooking?.id} •{" "}
                {getVehicleTypeName(selectedBooking?.vehicleType)}
              </p>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2 font-semibold">
                  Reason for Rejection *
                </label>
                <textarea
                  value={bookingRejectReason}
                  onChange={(e) => setBookingRejectReason(e.target.value)}
                  placeholder="Enter reason for rejecting this booking..."
                  rows="4"
                  className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-red-500 placeholder:text-white/40"
                />
                <p className="text-xs text-white40 mt-2">
                  {/* ✅ FIXED */}
                  This booking will be offered to other drivers with{" "}
                  {getVehicleTypeName(selectedBooking?.vehicleType)} vehicles.
                </p>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowBookingRejectModal(false);
                    setBookingRejectReason("");
                  }}
                  className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmRejectBooking}
                  disabled={loadingBookingAction}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingBookingAction ? "⏳ Processing..." : "Confirm Reject"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPredictionModal && assignedVehicle && vehiclePrediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPredictionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-gray-900/95 border border-white/20 rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  🤖 AI Maintenance Analysis
                  <span className="text-cyan-400">
                    • Vehicle #{assignedVehicle.id}
                  </span>
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPredictionModal(false)}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all text-2xl"
                >
                  ✕
                </motion.button>
              </div>

              <PredictiveMaintenancePanel vehicleId={assignedVehicle.id} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverDashboard;
