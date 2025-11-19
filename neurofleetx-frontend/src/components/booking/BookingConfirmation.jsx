import React from "react";
import { motion } from "framer-motion";

const BookingConfirmation = ({ booking, vehicle, onConfirm, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-6">✅ Confirm Booking</h3>

      {/* Summary */}
      <div className="space-y-3 mb-6">
        <SummaryItem label="Vehicle" value={`#${vehicle.vehicle_id}`} />
        <SummaryItem label="Date" value={booking.startDate} />
        <SummaryItem
          label="Time"
          value={`${booking.startTime} - ${booking.endTime}`}
        />
        <SummaryItem
          label="Total Price"
          value={`₹${booking.totalPrice?.toFixed(0) || 0}`}
          highlight
        />
      </div>

      {/* Terms */}
      <label className="flex items-start mb-6 cursor-pointer">
        <input type="checkbox" className="w-5 h-5 mt-1" defaultChecked />
        <span className="ml-3 text-white/70 text-sm">
          I agree to the terms and conditions
        </span>
      </label>

      {/* Confirm Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onConfirm(booking)}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
      >
        {loading ? "⏳ Confirming..." : "✓ Confirm Booking"}
      </motion.button>
    </motion.div>
  );
};

const SummaryItem = ({ label, value, highlight }) => (
  <div
    className={`flex justify-between p-3 rounded-lg ${
      highlight ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-white/5"
    }`}
  >
    <span
      className={highlight ? "text-cyan-400 font-semibold" : "text-white/70"}
    >
      {label}
    </span>
    <span
      className={
        highlight ? "text-cyan-400 font-bold" : "text-white font-semibold"
      }
    >
      {value}
    </span>
  </div>
);

export default BookingConfirmation;
