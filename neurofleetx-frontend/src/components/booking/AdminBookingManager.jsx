import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bookingApi from "../../api/bookingApi";

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadBookings = async () => {
    try {
      // Admin gets ALL bookings from system
      const res = await bookingApi.getAllBookings();
      console.log("📋 All bookings loaded:", res.data);
      setBookings(res.data || res);
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleTypeName = (vehicleType) => {
    if (!vehicleType) return "Unknown";
    if (typeof vehicleType === "string") return vehicleType;
    if (typeof vehicleType === "object" && vehicleType?.name)
      return vehicleType.name;
    return "Unknown";
  };

  const filteredBookings = (bookings || []).filter((booking) => {
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

  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b) => b.status === "PENDING").length || 0,
    confirmed: bookings?.filter((b) => b.status === "CONFIRMED").length || 0,
    rejected: bookings?.filter((b) => b.status === "REJECTED").length || 0,
    completed: bookings?.filter((b) => b.status === "COMPLETED").length || 0,
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING:
        "from-yellow-500/20 to-orange-500/10 text-yellow-400 border-yellow-500/30",
      CONFIRMED:
        "from-green-500/20 to-emerald-500/10 text-green-400 border-green-500/30",
      REJECTED: "from-red-500/20 to-pink-500/10 text-red-400 border-red-500/30",
      COMPLETED:
        "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30",
    };
    return colors[status?.toUpperCase()] || colors.PENDING;
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 flex items-center justify-center">
        <div className="text-white text-xl">Loading bookings...</div>
      </div>
    );
  }

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
              📋 Booking Management
            </h2>
            <p className="text-white/60 text-sm mt-1">
              System-wide booking oversight and monitoring
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadBookings}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            🔄 Refresh
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
            title: "Rejected",
            value: stats.rejected,
            icon: "❌",
            bg: "from-red-500/20 to-pink-500/10",
          },
          {
            title: "Completed",
            value: stats.completed,
            icon: "✔️",
            bg: "from-blue-500/20 to-cyan-500/10",
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
              { value: "rejected", label: "Rejected" },
              { value: "completed", label: "Completed" },
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
                      {booking.vehicleId && (
                        <div>
                          <span className="text-white/50">Vehicle:</span>{" "}
                          <span className="font-semibold text-white">
                            #{booking.vehicleId}
                          </span>
                        </div>
                      )}
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
                    </div>

                    {booking.rejectReason && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-xs text-red-400">
                          <strong>Rejected:</strong> {booking.rejectReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default BookingManager;
