import React, { useEffect, useState, useRef } from "react";
import { useGlobalState, actionTypes } from "../../context/GlobalState.jsx";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import FleetMap from "../map/FleetMap.jsx";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import BookingForm from "../booking/BookingForm.jsx";
import BookingList from "../booking/BookingList.jsx";

const CustomerDashboard = () => {
  const { state, dispatch } = useGlobalState();
  const navigate = useNavigate();

  // State management
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [viewMode, setViewMode] = useState("bookings");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [customerRoutes, setCustomerRoutes] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({
    startDate: "",
    endDate: "",
    pickupLocation: "",
    dropoffLocation: "",
  });

  const canvasRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // User info
  const userRole = localStorage.getItem("role") || "CUSTOMER";
  const userEmail = state.user?.username || "customer@neurofleetx.com";
  const userId = state.user?.id || localStorage.getItem("userId");

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

  const backgroundX = useTransform(mouseX, [0, window.innerWidth], [0, 100]);
  const backgroundY = useTransform(mouseY, [0, window.innerHeight], [0, 100]);

  // Load data
  useEffect(() => {
    loadCustomerData();
  }, [userId]);

  const loadCustomerData = async () => {
    try {
      // Load bookings
      const bookingsRes = await axiosInstance.get(`/customer/bookings/me`);

      const bookings = bookingsRes.data.map((b) => ({
        ...b,
        vehicleName: b.vehicle?.name || "Vehicle",
        status: b.status.toLowerCase(),
      }));
      setMyBookings(bookings);

      // Load available vehicles
      const vehiclesRes = await axiosInstance.get("/vehicles/available");
      setAvailableVehicles(vehiclesRes.data || []);

      // Load customer routes/trips
      try {
        const routesRes = await axiosInstance.get(`/routes/customer/${userId}`);
        setCustomerRoutes(routesRes.data || []);
        dispatch({ type: actionTypes.SET_ROUTES, payload: routesRes.data });
      } catch (error) {
        console.error("Error loading routes:", error);
        setCustomerRoutes([]);
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
    }
  };

  // Customer Operations
  const handleBookVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async () => {
    if (
      !bookingDetails.startDate ||
      !bookingDetails.endDate ||
      !bookingDetails.pickupLocation
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await axiosInstance.post("/customer/bookings", {
        vehicleId: selectedVehicle.id,
        customerId: userId,
        pickupLocation: bookingDetails.pickupLocation,
        dropoffLocation: bookingDetails.dropoffLocation || "",
        startTime: new Date(bookingDetails.startDate).toISOString(),
        endTime: new Date(bookingDetails.endDate).toISOString(),
      });

      const newBooking = {
        ...res.data,
        vehicleName: selectedVehicle.name,
        status: res.data.status.toLowerCase(),
      };

      setMyBookings((prev) => [...prev, newBooking]);
      setAvailableVehicles((prev) =>
        prev.filter((v) => v.id !== selectedVehicle.id)
      );
      setShowBookingModal(false);
      setSelectedVehicle(null);
      setBookingDetails({
        startDate: "",
        endDate: "",
        pickupLocation: "",
        dropoffLocation: "",
      });

      alert("Booking successful!");
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      await axiosInstance.put(`/customer/bookings/${bookingId}/cancel`);
      alert("Booking cancelled successfully!");
      loadCustomerData();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
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

  // Statistics
  const stats = {
    activeBookings: myBookings.filter((b) =>
      ["confirmed", "pending"].includes(b.status)
    ).length,
    completedBookings: myBookings.filter((b) => b.status === "completed")
      .length,
    totalBookings: myBookings.length,
    upcomingTrips: customerRoutes.filter((r) => r.status === "active").length,
  };

  const activeBookings = myBookings.filter((b) =>
    ["pending", "confirmed"].includes(b.status)
  );

  const bookedRoutes = customerRoutes.filter((r) => r.customerId === userId);

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
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.15, 0.25, 0.15],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
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
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
                Customer Dashboard
              </h1>
              <p className="text-white/60 text-sm">
                Book vehicles and manage your reservations
              </p>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                {[
                  { mode: "bookings", icon: "📋", label: "Bookings" },
                  { mode: "available", icon: "🚗", label: "Available" },
                  { mode: "trips", icon: "🚀", label: "My Trips" },
                  { mode: "history", icon: "📜", label: "History" },
                  { mode: "smart-booking", icon: "🤖", label: "AI Booking" },
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Active Bookings",
              value: stats.activeBookings,
              icon: "🚗",
              bg: "from-blue-500/20 to-cyan-500/10",
            },
            {
              title: "Completed",
              value: stats.completedBookings,
              icon: "✅",
              bg: "from-green-500/20 to-emerald-500/10",
            },
            {
              title: "Total Bookings",
              value: stats.totalBookings,
              icon: "📊",
              bg: "from-purple-500/20 to-pink-500/10",
            },
            {
              title: "Upcoming Trips",
              value: stats.upcomingTrips,
              icon: "🚀",
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

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {/* My Bookings View */}
          {viewMode === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                My Active Bookings
              </h2>
              {activeBookings.length === 0 ? (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No Active Bookings
                  </h3>
                  <p className="text-white/60 mb-6">
                    Browse available vehicles to make a reservation
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode("available")}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg"
                  >
                    Browse Vehicles
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeBookings.map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-white">
                          {booking.vehicleName}
                        </h3>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Start Date:</span>
                          <span className="text-white font-semibold">
                            {new Date(booking.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">End Date:</span>
                          <span className="text-white font-semibold">
                            {new Date(booking.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Pickup:</span>
                          <span className="text-white font-semibold">
                            {booking.pickupLocation}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCancelBooking(booking.id)}
                        className="w-full px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold hover:bg-red-500/30 transition-all"
                      >
                        Cancel Booking
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Available Vehicles View */}
          {viewMode === "available" && (
            <motion.div
              key="available"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Available Vehicles
              </h2>
              {availableVehicles.length === 0 ? (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <div className="text-6xl mb-4">🚗</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No Vehicles Available
                  </h3>
                  <p className="text-white/60">
                    Please check back later for available vehicles
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableVehicles.map((vehicle) => (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-white">
                          {vehicle.name}
                        </h3>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          Available
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Type:</span>
                          <span className="text-white font-semibold">
                            {vehicle.type || "Sedan"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Battery:</span>
                          <span className="text-white font-semibold">
                            {vehicle.batteryLevel}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Fuel:</span>
                          <span className="text-white font-semibold">
                            {vehicle.fuelLevel}%
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBookVehicle(vehicle)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        Book Now
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* My Trips View */}
          {viewMode === "trips" && (
            <motion.div
              key="trips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Trips Map */}
              <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Trip Routes
                </h2>
                <FleetMap
                  vehicles={[]}
                  routes={bookedRoutes}
                  height="400px"
                  showControls={true}
                  showLegend={true}
                  defaultStyle="dark"
                />
              </motion.div>

              {/* Trips List */}
              <motion.div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Your Trips
                </h2>
                {bookedRoutes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚀</div>
                    <p className="text-white/60">No upcoming trips</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookedRoutes.map((route) => (
                      <div
                        key={route.id}
                        className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-white font-semibold">
                              Vehicle: {route.vehicleId}
                            </p>
                            <p className="text-white/60 text-sm">
                              Driver: {route.driverId}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              route.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {route.status}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm">
                          ETA:{" "}
                          <span className="font-bold">
                            {route.eta.toFixed(1)} min
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* History View */}
          {viewMode === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Booking History
              </h2>
              {myBookings.filter((b) => b.status === "completed").length ===
              0 ? (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <div className="text-6xl mb-4">📜</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No History Yet
                  </h3>
                  <p className="text-white/60">
                    Your completed bookings will appear here
                  </p>
                </div>
              ) : (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="space-y-4">
                    {myBookings
                      .filter((b) => b.status === "completed")
                      .map((booking) => (
                        <div
                          key={booking.id}
                          className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center"
                        >
                          <div>
                            <h3 className="text-white font-semibold">
                              {booking.vehicleName}
                            </h3>
                            <p className="text-white/60 text-sm">
                              {new Date(booking.startDate).toLocaleDateString()}{" "}
                              - {new Date(booking.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-semibold">
                            Completed
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {viewMode === "smart-booking" && (
            <motion.div
              key="smart-booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 space-y-6">
                  <BookingForm onBookingCreated={loadCustomerData} />
                  <BookingList />
                </div>
                <div className="col-span-2">
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      🗺️ Live Tracking
                    </h3>
                    <div className="h-[600px] bg-slate-800/50 rounded-xl overflow-hidden">
                      <FleetMap
                        vehicles={availableVehicles}
                        routes={customerRoutes}
                        height="600px"
                        showControls={true}
                        defaultStyle="dark"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Book Vehicle
              </h2>
              {selectedVehicle && (
                <>
                  <p className="text-white/70 mb-6">
                    Vehicle:{" "}
                    <span className="font-bold text-white">
                      {selectedVehicle.name}
                    </span>
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={bookingDetails.startDate}
                        onChange={(e) =>
                          setBookingDetails({
                            ...bookingDetails,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={bookingDetails.endDate}
                        onChange={(e) =>
                          setBookingDetails({
                            ...bookingDetails,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        Pickup Location *
                      </label>
                      <input
                        type="text"
                        value={bookingDetails.pickupLocation}
                        onChange={(e) =>
                          setBookingDetails({
                            ...bookingDetails,
                            pickupLocation: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500"
                        placeholder="Enter pickup location"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        Dropoff Location
                      </label>
                      <input
                        type="text"
                        value={bookingDetails.dropoffLocation}
                        onChange={(e) =>
                          setBookingDetails({
                            ...bookingDetails,
                            dropoffLocation: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500"
                        placeholder="Enter dropoff location"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1 px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmitBooking}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      Confirm
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
    </div>
  );
};

export default CustomerDashboard;
