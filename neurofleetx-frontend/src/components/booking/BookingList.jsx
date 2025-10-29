import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bookingApi from "../../api/bookingApi";
import { useGlobalState, actionTypes } from "../../context/GlobalState";

export default function BookingList() {
  const { state, dispatch } = useGlobalState();
  const userId = state.user?.id || localStorage.getItem("userId");

  useEffect(() => {
    loadBookings();
  }, [userId]);

  const loadBookings = async () => {
    try {
      const res = await bookingApi.getCustomerBookings(userId);
      dispatch({ type: actionTypes.SET_BOOKINGS, payload: res.data || res });
    } catch (err) {
      console.error("Error loading bookings:", err);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      const res = await bookingApi.cancelBooking(id, userId);
      dispatch({ type: actionTypes.UPDATE_BOOKING, payload: res.data || res });
      alert("✅ Booking cancelled successfully!");
      loadBookings(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Cancel failed: " + (err.response?.data?.message || err.message));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      CONFIRMED:
        "from-green-500/20 to-emerald-500/10 text-green-400 border-green-500/30",
      PENDING:
        "from-yellow-500/20 to-orange-500/10 text-yellow-400 border-yellow-500/30",
      COMPLETED:
        "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30",
      CANCELLED:
        "from-red-500/20 to-pink-500/10 text-red-400 border-red-500/30",
    };
    return colors[status?.toUpperCase()] || colors["PENDING"];
  };

  const bookings = state.bookings || [];
  const activeBookings = bookings.filter((b) =>
    ["PENDING", "CONFIRMED", "pending", "confirmed"].includes(b.status)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-4">
        📋 My Active Bookings
      </h3>

      {activeBookings.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-white/60">No active bookings</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {activeBookings.map((b, index) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-white font-bold">
                        {b.vehicle?.name || b.vehicleType || "Vehicle"}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold bg-gradient-to-r border ${getStatusColor(
                          b.status
                        )}`}
                      >
                        {b.status?.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-white/70">
                      <div>
                        🚗 <strong>Type:</strong> {b.vehicleType || "Standard"}
                      </div>
                      <div>
                        📍 <strong>Pickup:</strong> {b.pickupLocation}
                      </div>
                      {b.dropoffLocation && (
                        <div>
                          🎯 <strong>Dropoff:</strong> {b.dropoffLocation}
                        </div>
                      )}
                      <div>
                        🕐 <strong>Start:</strong>{" "}
                        {new Date(b.startTime).toLocaleString()}
                      </div>
                      <div>
                        🕑 <strong>End:</strong>{" "}
                        {new Date(b.endTime).toLocaleString()}
                      </div>
                      {b.price && (
                        <div className="text-cyan-400 font-semibold">
                          💰 Price: ${b.price}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {["CONFIRMED", "PENDING", "confirmed", "pending"].includes(
                      b.status
                    ) && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCancel(b.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold hover:bg-red-500/30 transition-all text-sm"
                      >
                        ❌ Cancel
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
