import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bookingApi from "../../api/bookingApi";
import RecommendedVehicleCard from "./VehicleRecommendationCard";

const VehicleRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [filters, setFilters] = useState({
    vehicleType: "",
    isEv: false,
    seatsNeeded: 4,
    priceRange: "Standard",
    startTime: new Date().toISOString().split("T")[0],
    endTime: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const payload = {
        vehicleType: filters.vehicleType,
        isEvPreferred: filters.isEv,
        seatsNeeded: filters.seatsNeeded,
        distanceKm: 50,
        priceRange: filters.priceRange,
        startTime: `${filters.startTime}T09:00:00`,
        endTime: `${filters.endTime}T17:00:00`,
      };

      const response = await bookingApi.getVehicleRecommendations(payload);
      setRecommendations(response.data || []);
    } catch (error) {
      console.error("❌ Error loading recommendations:", error);
      alert("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleApplyFilters = () => {
    loadRecommendations();
  };

  const handleSelectVehicle = (vehicle) => {
    // Redirect to booking page with selected vehicle
    window.location.href = `/customer/book?vehicleId=${vehicle.vehicle_id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            🤖 AI-Recommended Vehicles
          </h1>
          <p className="text-white/60">
            Personalized vehicle suggestions based on your preferences
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4">
            🔍 Refine Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Vehicle Type */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Vehicle Type
              </label>
              <select
                name="vehicleType"
                value={filters.vehicleType}
                onChange={handleFilterChange}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="">All Types</option>
                <option value="Car">🚗 Car</option>
                <option value="Van">🚐 Van</option>
                <option value="Truck">🚚 Truck</option>
                <option value="EV">⚡ EV</option>
                <option value="Bike">🏍️ Bike</option>
              </select>
            </div>

            {/* Seats */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Seats Needed
              </label>
              <input
                type="number"
                name="seatsNeeded"
                min="1"
                max="8"
                value={filters.seatsNeeded}
                onChange={handleFilterChange}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Price Range
              </label>
              <select
                name="priceRange"
                value={filters.priceRange}
                onChange={handleFilterChange}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="Budget">💰 Budget</option>
                <option value="Standard">💵 Standard</option>
                <option value="Premium">💎 Premium</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Date
              </label>
              <input
                type="date"
                name="startTime"
                value={filters.startTime}
                onChange={handleFilterChange}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            {/* EV Checkbox */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isEv"
                  checked={filters.isEv}
                  onChange={handleFilterChange}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white font-semibold">⚡ Prefer EV</span>
              </label>
            </div>
          </div>

          {/* Apply Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleApplyFilters}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50"
          >
            {loading ? "🔄 Applying..." : "✓ Apply Filters"}
          </motion.button>
        </motion.div>

        {/* Recommendations Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading ? (
            <LoadingSpinner />
          ) : recommendations.length === 0 ? (
            <NoRecommendations />
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white">
                  ✨ {recommendations.length} Vehicles Found
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  Based on your preferences and availability
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {recommendations.map((vehicle, index) => (
                    <motion.div
                      key={vehicle.vehicle_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <RecommendedVehicleCard
                        vehicle={vehicle}
                        onSelect={() => handleSelectVehicle(vehicle)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <motion.div
    className="flex justify-center items-center h-96"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-6xl mb-4"
      >
        ⏳
      </motion.div>
      <p className="text-white/60">Loading recommendations...</p>
    </div>
  </motion.div>
);

// No Recommendations Component
const NoRecommendations = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl"
  >
    <div className="text-6xl mb-4">🚗</div>
    <h3 className="text-2xl font-bold text-white mb-2">
      No Vehicles Available
    </h3>
    <p className="text-white/60 mb-6">
      Sorry, no vehicles match your search criteria. Try adjusting your filters.
    </p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => window.location.reload()}
      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg"
    >
      🔄 Refresh
    </motion.button>
  </motion.div>
);

export default VehicleRecommendations;
