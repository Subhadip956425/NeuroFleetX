import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bookingApi from "../../api/bookingApi";
import { useGlobalState } from "../../context/GlobalState";

export default function BookingManager() {
  const { state } = useGlobalState();

  // ✅ Get manager ID from global state
  const managerId = state.user?.id;

  // ✅ STATE DECLARATIONS
  const [bookings, setBookings] = useState([]); // ✅ ADD THIS
  const [loading, setLoading] = useState(false); // ✅ ADD THIS
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);

  // DEBUG: Log manager ID
  useEffect(() => {
    console.log("👤 Manager ID:", managerId);
    console.log("👤 State user:", state.user);
  }, [state.user, managerId]);

  // Helper function to safely get vehicle type name
  const getVehicleTypeName = (vehicleType) => {
    if (!vehicleType) return "Unknown";
    if (typeof vehicleType === "string") return vehicleType;
    if (typeof vehicleType === "object" && vehicleType?.name)
      return vehicleType.name;
    return "Unknown";
  };

  useEffect(() => {
    loadBookings();

    // Refresh every 15 seconds
    const interval = setInterval(loadBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  // ✅ FIXED: Load all bookings
  const loadBookings = async () => {
    try {
      setLoading(true);

      // ✅ Get all bookings for manager
      const res = await bookingApi.getAllBookings();
      const allBookings = Array.isArray(res) ? res : res.data || [];

      setBookings(allBookings);
      console.log("📋 Bookings loaded:", allBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
      alert("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Filter bookings using bookings state
  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === "PENDING"),
    [bookings]
  );

  const confirmedBookings = useMemo(
    () => bookings.filter((b) => b.status === "CONFIRMED"),
    [bookings]
  );

  const cancelledBookings = useMemo(
    () => bookings.filter((b) => b.status === "CANCELLED"),
    [bookings]
  );

  // ✅ Check role
  const userRole = localStorage.getItem("role");
  if (userRole !== "MANAGER" && userRole !== "ROLE_MANAGER") {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
        <p className="text-white/60">Only managers can access this page.</p>
      </div>
    );
  }

  const handleRejectClick = (booking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert("⚠️ Please provide a reason");
      return;
    }

    if (!managerId) {
      alert("❌ Manager ID not found. Please log in again.");
      return;
    }

    try {
      setLoadingAction(selectedBooking.id);

      // ✅ FIXED: Pass THREE parameters
      await bookingApi.managerRejectBooking(
        selectedBooking.id, // bookingId
        managerId, // managerId
        rejectReason // reason
      );

      console.log("✅ Booking cancelled");
      alert("✅ Booking cancelled successfully");

      setShowRejectModal(false);
      setRejectReason("");
      setSelectedBooking(null);

      // Reload bookings
      await loadBookings();
    } catch (error) {
      console.error("❌ Error rejecting booking:", error);
      console.error("Full error response:", error.response?.data); // Log full error
      alert(
        "❌ Failed to reject booking: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoadingAction(null);
    }
  };

  // ✅ FIXED: Filter bookings using bookings state
  const filteredBookings = bookings.filter((booking) => {
    const vehicleTypeName = getVehicleTypeName(booking.vehicleType);

    const matchesSearch =
      booking.customerId
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      vehicleTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.pickupLocation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      booking.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // ✅ FIXED: Statistics using bookings state
  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b) => b.status === "PENDING").length || 0,
    confirmed: bookings?.filter((b) => b.status === "CONFIRMED").length || 0,
    cancelled: bookings?.filter((b) => b.status === "CANCELLED").length || 0,
    completed: bookings?.filter((b) => b.status === "COMPLETED").length || 0,
    // ✅ NEW: Payment stats
    paid: bookings?.filter((b) => b.isPaid).length || 0,
    unpaid: bookings?.filter((b) => !b.isPaid).length || 0,
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING:
        "from-yellow-500/20 to-orange-500/10 text-yellow-400 border-yellow-500/30",
      CONFIRMED:
        "from-green-500/20 to-emerald-500/10 text-green-400 border-green-500/30",
      CANCELLED:
        "from-red-500/20 to-pink-500/10 text-red-400 border-red-500/30",
      COMPLETED:
        "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30",
    };
    return colors[status?.toUpperCase()] || colors.PENDING;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              📋 Booking Oversight & Control
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Review bookings • Cancel to prevent driver assignment • Monitor
              all activities
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadBookings}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? "⏳ Loading..." : "🔄 Refresh"}
          </motion.button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            title: "Total",
            value: stats.total,
            icon: "📊",
            bg: "from-blue-500/20 to-cyan-500/10",
          },
          {
            title: "Pending",
            value: stats.pending,
            icon: "⏳",
            bg: "from-yellow-500/20 to-orange-500/10",
          },
          {
            title: "Confirmed",
            value: stats.confirmed,
            icon: "✅",
            bg: "from-green-500/20 to-emerald-500/10",
          },
          {
            title: "Cancelled",
            value: stats.cancelled,
            icon: "❌",
            bg: "from-red-500/20 to-pink-500/10",
          },
          {
            title: "Completed",
            value: stats.completed,
            icon: "✔️",
            bg: "from-blue-500/20 to-cyan-500/10",
          },
          {
            title: "Paid",
            value: stats.paid,
            icon: "💰",
            bg: "from-green-500/20 to-emerald-500/10",
          },
          {
            title: "Unpaid",
            value: stats.unpaid,
            icon: "⏰",
            bg: "from-orange-500/20 to-yellow-500/10",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative group"
          >
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${stat.bg} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
              <motion.div
                whileHover={{ scale: 1.2, rotate: 10 }}
                className="text-2xl mb-2"
              >
                {stat.icon}
              </motion.div>
              <h3 className="text-2xl font-black text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-white/60 text-xs font-semibold">
                {stat.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4"
      >
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="🔍 Search by customer, vehicle type, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500 placeholder:text-white/40"
            />
          </div>
          <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
            {[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "cancelled", label: "Cancelled" },
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

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center"
          >
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Bookings Found
            </h3>
            <p className="text-white/60">
              {searchQuery
                ? "Try adjusting your search"
                : "No booking requests at the moment"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-white">
                        Booking #{booking.id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r border ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status?.toUpperCase()}
                      </span>
                      {/* ✅ NEW: Payment Status Badge */}
                      {booking.isPaid ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                          ✅ Paid
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold border border-orange-500/30">
                          💳 Unpaid
                        </span>
                      )}

                      <span className="text-sm text-white/60">
                        🚗 {getVehicleTypeName(booking.vehicleType)}
                      </span>
                      {booking.assignedDriverId && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-semibold">
                          👤 Driver #{booking.assignedDriverId}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/70">
                      <div>
                        <span className="text-white/50">Customer:</span>{" "}
                        <span className="font-semibold text-white">
                          #{booking.customerId}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Vehicle:</span>{" "}
                        <span className="font-semibold text-white">
                          {booking.vehicle?.name ||
                            getVehicleTypeName(booking.vehicleType)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">📍 Pickup:</span>{" "}
                        <span className="font-semibold text-white">
                          {booking.pickupLocation}
                        </span>
                      </div>
                      {booking.dropoffLocation && (
                        <div>
                          <span className="text-white/50">🎯 Dropoff:</span>{" "}
                          <span className="font-semibold text-white">
                            {booking.dropoffLocation}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-white/50">🕐 Start:</span>{" "}
                        <span className="font-semibold text-white">
                          {new Date(booking.startTime).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">🕑 End:</span>{" "}
                        <span className="font-semibold text-white">
                          {new Date(booking.endTime).toLocaleString()}
                        </span>
                      </div>
                      {/* ✅ NEW: Payment Status Row */}
                      <div>
                        <span className="text-white/50">💰 Payment:</span>{" "}
                        {booking.isPaid ? (
                          <span className="font-bold text-green-400">
                            ✅ Paid (₹{booking.price?.toFixed(2)})
                          </span>
                        ) : (
                          <span className="font-bold text-orange-400">
                            ⏳ Pending (₹{booking.price?.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Workflow Status Info */}
                    {booking.status === "PENDING" &&
                      !booking.assignedDriverId && (
                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-xs text-blue-400">
                            ℹ️ Awaiting driver acceptance from{" "}
                            {getVehicleTypeName(booking.vehicleType)} fleet
                          </p>
                        </div>
                      )}

                    {booking.rejectReason && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-xs text-red-400">
                          <strong>Cancelled by:</strong>{" "}
                          {booking.rejectedBy || "Manager"}
                          <br />
                          <strong>Reason:</strong> {booking.rejectReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                    {(booking.status === "PENDING" ||
                      booking.status === "CONFIRMED") && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRejectClick(booking)}
                        disabled={loadingAction === booking.id}
                        className="flex-1 lg:flex-none px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction === booking.id ? "⏳" : "❌ Cancel"}
                      </motion.button>
                    )}
                    {booking.status === "CANCELLED" && (
                      <div className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-center font-semibold text-sm">
                        ❌ Cancelled
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
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
                Cancel Booking?
              </h2>
              <p className="text-white/70 text-center mb-6">
                Booking #{selectedBooking?.id} •{" "}
                {getVehicleTypeName(selectedBooking?.vehicleType)}
                <br />
                <span className="text-xs text-red-400">
                  This will prevent drivers from seeing this booking
                </span>
              </p>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2 font-semibold">
                  Reason for Cancellation * (Manager Override)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for cancelling this booking..."
                  rows="4"
                  className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-red-500 placeholder:text-white/40"
                />
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmReject}
                  disabled={loadingAction}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction ? "⏳ Processing..." : "Confirm Cancel"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
