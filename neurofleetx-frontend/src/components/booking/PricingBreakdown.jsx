import React from "react";
import { motion } from "framer-motion";

const PricingBreakdown = ({ vehicle, booking }) => {
  const basePrice = booking.selectedSlot?.pricePerHour || 50;
  const duration = calculateDuration(booking.startTime, booking.endTime);
  const subtotal = basePrice * duration;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
    >
      <h3 className="text-xl font-bold text-white">💰 Pricing Details</h3>

      {/* Vehicle */}
      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-white/60 text-sm">Vehicle</p>
        <p className="text-white font-bold">
          Vehicle #{vehicle.vehicle_id || "---"}
        </p>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm">Date</p>
          <p className="text-white font-bold">{booking.startDate || "---"}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/60 text-sm">Duration</p>
          <p className="text-white font-bold">{duration}h</p>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <div className="flex justify-between text-white">
          <span>
            Rental ({duration}h × ₹{basePrice})
          </span>
          <span className="font-semibold">₹{subtotal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>GST (18%)</span>
          <span>₹{tax.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-cyan-400 border-t border-white/10 pt-3">
          <span>Total Amount</span>
          <span>₹{total.toFixed(0)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
        ℹ️ Prices are inclusive of insurance and maintenance fees
      </div>
    </motion.div>
  );
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 1;
  const start = new Date(`2025-01-01 ${startTime}`);
  const end = new Date(`2025-01-01 ${endTime}`);
  return Math.round((end - start) / (1000 * 60 * 60));
};

export default PricingBreakdown;
