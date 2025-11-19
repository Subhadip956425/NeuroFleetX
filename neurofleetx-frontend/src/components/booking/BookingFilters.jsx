import React, { useState } from "react";
import { motion } from "framer-motion";

const BookingFilters = ({ onSubmit, loading }) => {
  const [filters, setFilters] = useState({
    vehicleType: "Car",
    seatsNeeded: 4,
    isEv: false,
    priceRange: "Standard",
    pickupLocation: "Kolkata",
    dropoffLocation: "Mumbai",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("🎯 Step 1: Filter submitted:", filters);
    onSubmit(filters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8"
    >
      <h2 className="text-3xl font-bold text-white mb-8">🔍 Filter Vehicles</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white font-semibold mb-3">
              🚗 Vehicle Type
            </label>
            <select
              name="vehicleType"
              value={filters.vehicleType}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-cyan-400 outline-none"
            >
              <option value="Car">Car</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="EV">Electric Vehicle</option>
            </select>
          </div>

          {/* Seats */}
          <div>
            <label className="block text-white font-semibold mb-3">
              👥 Seats Required
            </label>
            <select
              name="seatsNeeded"
              value={filters.seatsNeeded}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-cyan-400 outline-none"
            >
              <option value={1}>1 Seat</option>
              <option value={2}>2 Seats</option>
              <option value={4}>4 Seats</option>
              <option value={5}>5+ Seats</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-white font-semibold mb-3">
              💰 Price Range
            </label>
            <select
              name="priceRange"
              value={filters.priceRange}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-cyan-400 outline-none"
            >
              <option value="Budget">Budget</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          {/* EV Checkbox */}
          <div className="flex items-end">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isEv"
                checked={filters.isEv}
                onChange={handleChange}
                className="w-5 h-5 rounded"
              />
              <span className="text-white font-semibold">⚡ EV Only</span>
            </label>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-white font-semibold mb-3">
              📍 Pickup Location
            </label>
            <input
              type="text"
              name="pickupLocation"
              value={filters.pickupLocation}
              onChange={handleChange}
              placeholder="Enter city"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Dropoff Location */}
          <div>
            <label className="block text-white font-semibold mb-3">
              📍 Dropoff Location
            </label>
            <input
              type="text"
              name="dropoffLocation"
              value={filters.dropoffLocation}
              onChange={handleChange}
              placeholder="Enter city"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-cyan-400 outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? "⏳ Loading..." : "🔍 Search Vehicles"}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default BookingFilters;
