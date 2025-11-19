import React, { useState } from "react";
import { motion } from "framer-motion";

const TimeSlotPicker = ({ slots, onSlotSelect }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    onSlotSelect(slot);
  };

  if (!slots || slots.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl"
      >
        <div className="text-6xl mb-4">⏰</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          No available slots
        </h3>
        <p className="text-white/60">Try selecting a different date</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">
        ⏰ Select Time Slot
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSlotClick(slot)}
            className={`p-4 rounded-xl transition-all border ${
              selectedSlot === slot
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white"
                : "bg-white/10 border-white/20 text-white hover:border-white/40"
            }`}
          >
            <div className="font-bold text-lg">
              {slot.startTime || "09:00"} - {slot.endTime || "17:00"}
            </div>
            <div className="text-sm font-semibold mt-2">
              ₹
              {(
                slot.pricePerHour *
                calculateDuration(slot.startTime, slot.endTime)
              ).toFixed(0)}
            </div>
            <div className="text-xs text-white/60 mt-1">
              {calculateDuration(slot.startTime, slot.endTime)}h rental
            </div>
          </motion.button>
        ))}
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

export default TimeSlotPicker;
