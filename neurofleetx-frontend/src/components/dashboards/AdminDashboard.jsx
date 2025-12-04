import React, { useEffect, useState, useRef } from "react";
import { useGlobalState, actionTypes } from "../../context/GlobalState.jsx";
import { connectWebSocket } from "../../api/wsClient";
import { fetchVehicles } from "../../api/vehicleApi";
import { useNavigate } from "react-router-dom";
import FleetMap from "../map/FleetMap.jsx";
import VehicleCard from "../../components/VehicleCard";
import VehicleModal from "../../components/VehicleModal";
import VehicleDashboardKPIs from "../../components/VehicleDashboardKPIs";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../api/axiosInstance.js";
import routeApi from "../../api/routeApi.js";
import RouteMap from "../map/RouteMap.jsx";
import MaintenanceCharts from "../maintenance/MaintenanceCharts.jsx";
import AlertsTable from "../maintenance/AlertsTable.jsx";
import VehicleHealthCard from "../maintenance/VehicleHealthCard.jsx";
import maintenanceApi from "../../api/maintenanceApi.js";
import HourlyActivityChart from "../analytics/HourlyActivityChart.jsx";
import ExportReports from "../analytics/ExportReports.jsx";
import BookingManager from "../booking/AdminBookingManager.jsx";
import FleetHeatmap from "../analytics/FleetHeatmap.jsx";
import RevenueAnalytics from "../analytics/RevenueAnalytics.jsx";
import AIMaintenanceDashboard from "../maintenance/AIMaintenanceDashboard";

const AdminDashboard = () => {
  const { state, dispatch } = useGlobalState();
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState("analytics");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [resolvedTickets, setResolvedTickets] = useState([]);

  // ✅ Logout state - like Manager
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [alertStats, setAlertStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    total: 0,
    resolved: 0,
  });

  const wsRef = useRef(null);

  // User info
  const userRole = localStorage.getItem("role") || "ADMIN";
  const userEmail = state.user?.username || "admin@neurofleetx.com";

  // ✅ Updated loadVehicles with role awareness
  const loadVehicles = async (role = "ADMIN") => {
    try {
      setIsLoading(true);
      console.log(`📡 Loading vehicles for ${role}`);

      const vehicles = await fetchVehicles(role);

      dispatch({
        type: actionTypes.SET_VEHICLES,
        payload: vehicles || [],
      });
      console.log(`✅ Loaded ${vehicles.length} vehicles`);
    } catch (error) {
      console.error("❌ Error loading vehicles:", error);
      alert("Failed to load vehicles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await routeApi.getAllRoutes();
      setRoutes(response.data);
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  };

  // ✅ IMPROVED: Load maintenance data with better error handling and data flow
  const loadMaintenanceData = async () => {
    try {
      console.log("📡 Loading maintenance data...");

      const [openTicketsRes, resolvedTicketsRes] = await Promise.all([
        maintenanceApi.getOpenTickets(),
        maintenanceApi.getResolvedTickets(),
      ]);

      // ✅ Better data extraction
      const openTicketsData = Array.isArray(openTicketsRes.data)
        ? openTicketsRes.data
        : Array.isArray(openTicketsRes)
        ? openTicketsRes
        : [];

      const resolvedTicketsData = Array.isArray(resolvedTicketsRes.data)
        ? resolvedTicketsRes.data
        : Array.isArray(resolvedTicketsRes)
        ? resolvedTicketsRes
        : [];

      console.log("✅ Open tickets loaded:", openTicketsData.length);
      console.log("✅ Resolved tickets loaded:", resolvedTicketsData.length);

      setTickets(openTicketsData);
      setResolvedTickets(resolvedTicketsData);

      // ✅ CRITICAL: Calculate stats from actual data
      const stats = {
        critical: openTicketsData.filter(
          (t) => t.severity === "CRITICAL" || t.severity === "HIGH"
        ).length,
        high: openTicketsData.filter(
          (t) => t.severity === "HIGH" || t.severity === "MEDIUM"
        ).length,
        medium: openTicketsData.filter(
          (t) => t.severity === "MEDIUM" || t.severity === "LOW"
        ).length,
        total: openTicketsData.length,
        resolved: resolvedTicketsData.length,
      };

      console.log("📊 Calculated stats:", stats);
      setAlertStats(stats);
    } catch (error) {
      console.error("❌ Error loading maintenance data:", error);

      // ✅ Set empty state on error
      setAlertStats({
        critical: 0,
        high: 0,
        medium: 0,
        total: 0,
        resolved: 0,
      });
      setTickets([]);
      setResolvedTickets([]);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadRoutes();
    loadMaintenanceData();
  }, []);

  useEffect(() => {
    wsRef.current = connectWebSocket((data) => {
      if (data.vehicles) {
        dispatch({
          type: actionTypes.SET_VEHICLES,
          payload: data.vehicles,
        });
      }
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [dispatch]);

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setShowVehicleModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        console.log(`🗑️ Deleting vehicle ${vehicleId}`);
        // ✅ CORRECT: /vehicles/{id}
        await axiosInstance.delete(`/vehicles/${vehicleId}`);

        dispatch({
          type: actionTypes.DELETE_VEHICLE,
          payload: vehicleId,
        });

        console.log("✅ Vehicle deleted successfully");
        alert("✅ Vehicle deleted successfully");
      } catch (error) {
        console.error("❌ Error deleting vehicle:", error);
        alert(`❌ Failed to delete vehicle: ${error.message}`);
      }
    }
  };

  const handleRouteClick = (route) => {
    setSelectedRoute(route);
    setViewMode("routes");
  };

  // ✅ Logout handlers - like Manager
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    dispatch({ type: actionTypes.LOGOUT });
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 max-w-[1920px] mx-auto p-6 space-y-6">
        {/* ✅ Header with User Menu - Like Manager */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 relative z-50"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
                🎯 Admin Control Center
              </h1>
              <p className="text-white/60 text-sm">
                {state.vehicles?.length || 0} vehicles • Real-time fleet
                management
              </p>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              {/* Add Vehicle Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddVehicle}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <span className="mr-2">➕</span>
                Add Vehicle
              </motion.button>

              {/* ✅ User Menu - Like Manager */}
              <div className="relative z-[100]">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
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

                {/* User Dropdown Menu */}
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

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-2"
        >
          <div className="flex gap-2 overflow-x-auto">
            {[
              {
                id: "analytics",
                mode: "analytics",
                icon: "📊",
                label: "Analytics",
              },
              { id: "grid", mode: "grid", icon: "▦", label: "Grid" },
              { id: "map", mode: "map", icon: "🗺️", label: "Map" },
              {
                id: "bookings",
                mode: "bookings",
                icon: "📅",
                label: "Bookings",
              },
              {
                id: "revenue",
                mode: "revenue",
                icon: "💰",
                label: "Revenue",
              },
              {
                id: "maintenance",
                mode: "maintenance",
                icon: "🔧",
                label: "Maintenance",
              },
              {
                id: "ai-maintenance",
                mode: "ai-maintenance",
                icon: "🤖",
                label: "AI Maintenance",
              },
              {
                id: "heatmap",
                mode: "heatmap",
                icon: "🔥",
                label: "Fleet Heatmap",
              },
              { id: "reports", mode: "reports", icon: "📄", label: "Reports" },
            ].map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(item.mode)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
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
        </motion.div>

        {/* Content Views - same as before */}
        <AnimatePresence mode="wait">
          {viewMode === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VehicleDashboardKPIs />
              <div className="mt-6">
                <HourlyActivityChart />
              </div>
            </motion.div>
          )}

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
                      vehicle={vehicle}
                      onEdit={handleEditVehicle}
                      onDelete={handleDeleteVehicle}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {viewMode === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <FleetMap
                vehicles={state.vehicles}
                onVehicleClick={handleEditVehicle}
              />
            </motion.div>
          )}

          {viewMode === "routes" && (
            <motion.div
              key="routes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RouteMap
                routes={routes}
                selectedRoute={selectedRoute}
                onRouteSelect={handleRouteClick}
              />
            </motion.div>
          )}

          {viewMode === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BookingManager />
            </motion.div>
          )}

          {viewMode === "revenue" && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RevenueAnalytics />
            </motion.div>
          )}

          {viewMode === "maintenance" && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  {
                    title: "Total Open",
                    value: alertStats.total || 0,
                    icon: "🎫",
                    bg: "from-blue-500/20 to-cyan-500/10",
                  },
                  {
                    title: "Critical",
                    value: alertStats.critical || 0,
                    icon: "🚨",
                    bg: "from-red-500/20 to-pink-500/10",
                  },
                  {
                    title: "High Priority",
                    value: alertStats.high || 0,
                    icon: "⚠️",
                    bg: "from-orange-500/20 to-yellow-500/10",
                  },
                  {
                    title: "Medium Priority",
                    value: alertStats.medium || 0,
                    icon: "📋",
                    bg: "from-yellow-500/20 to-green-500/10",
                  },
                  {
                    title: "Resolved",
                    value: alertStats.resolved || 0,
                    icon: "✅",
                    bg: "from-green-500/20 to-emerald-500/10",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
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

              <MaintenanceCharts stats={alertStats} />

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    🔧 Vehicle Health Status
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadMaintenanceData}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg"
                  >
                    🔄 Refresh
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.vehicles?.slice(0, 6).map((vehicle) => (
                    <VehicleHealthCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onClick={() => handleEditVehicle(vehicle)}
                    />
                  ))}
                </div>
              </div>

              <AlertsTable tickets={tickets} onRefresh={loadMaintenanceData} />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      ✅ Resolved Tickets
                    </h3>
                    <p className="text-white/60 text-sm mt-1">
                      {resolvedTickets.length} resolved{" "}
                      {resolvedTickets.length === 1 ? "ticket" : "tickets"}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadMaintenanceData}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg"
                  >
                    🔄 Refresh
                  </motion.button>
                </div>

                {resolvedTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      No Resolved Tickets Yet
                    </h3>
                    <p className="text-white/60">
                      Resolved tickets will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {resolvedTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="backdrop-blur-sm bg-green-500/5 border border-green-500/20 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-bold text-white">
                                Ticket #{ticket.id}
                              </h4>
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                RESOLVED
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/60">
                                {ticket.severity}
                              </span>
                            </div>
                            <p className="text-white/70 text-sm mb-2">
                              {ticket.description}
                            </p>
                            <div className="flex gap-4 text-sm text-white/60">
                              <span>🚗 Vehicle #{ticket.vehicleId}</span>
                              <span>
                                📅 Reported:{" "}
                                {new Date(
                                  ticket.reportedAt
                                ).toLocaleDateString()}
                              </span>
                              {ticket.resolvedAt && (
                                <span className="text-green-400">
                                  ✅ Resolved:{" "}
                                  {new Date(
                                    ticket.resolvedAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-semibold hover:bg-blue-500/30 transition-all"
                          >
                            👁️ View Details
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

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

          {viewMode === "heatmap" && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FleetHeatmap />
            </motion.div>
          )}

          {viewMode === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ExportReports />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ Logout Confirmation Modal - Like Manager */}
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
                  Are you sure you want to logout? You will need to login again
                  to access the dashboard.
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

        {/* Vehicle Modal */}
        {/* Vehicle Modal */}
        <AnimatePresence>
          {showVehicleModal && (
            <VehicleModal
              show={showVehicleModal}
              vehicle={selectedVehicle}
              onClose={() => {
                console.log("🔐 Closing VehicleModal");
                setShowVehicleModal(false);
                setSelectedVehicle(null);
              }}
              onSubmit={async (vehicleData) => {
                try {
                  console.log("📤 Submitting vehicle data:", vehicleData);

                  if (selectedVehicle?.id) {
                    // ✅ UPDATE existing - using correct endpoint
                    console.log(`🔄 Updating vehicle ${selectedVehicle.id}`);
                    await axiosInstance.put(
                      `/vehicles/${selectedVehicle.id}`, // ✅ CORRECT: /vehicles/{id}
                      vehicleData
                    );
                    console.log("✅ Vehicle updated successfully");
                  } else {
                    // ✅ CREATE new - using correct endpoint
                    console.log("✨ Creating new vehicle");
                    await axiosInstance.post(
                      `/vehicles`, // ✅ CORRECT: /vehicles (no /admin)
                      vehicleData
                    );
                    console.log("✅ Vehicle created successfully");
                  }

                  // ✅ Reload the vehicles list
                  await loadVehicles("ADMIN"); // Pass role for correct endpoint
                  console.log("🔄 Vehicles list refreshed");
                } catch (error) {
                  console.error("❌ Error saving vehicle:", error);
                  const errorMessage =
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to save vehicle";
                  throw new Error(errorMessage);
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
