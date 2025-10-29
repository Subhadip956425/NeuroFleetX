import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bookingApi from "../../api/bookingApi";
import { useGlobalState, actionTypes } from "../../context/GlobalState";

export default function BookingForm({ onBookingCreated }) {
  const { state, dispatch } = useGlobalState();
  const [form, setForm] = useState({
    vehicleType: "",
    isEv: false,
    startTime: "",
    endTime: "",
    seats: 1,
    pickupLocation: "",
    dropoffLocation: "",
  });
  const [recs, setRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [hoveredVehicleType, setHoveredVehicleType] = useState(null);

  // Vehicle types configuration
  const vehicleTypes = [
    {
      id: "car",
      value: "Car",
      icon: "🚗",
      label: "Car",
      description: "Sedan, Coupe",
      gradient: "from-blue-500/20 to-cyan-500/10",
    },
    {
      id: "van",
      value: "Van",
      icon: "🚐",
      label: "Van",
      description: "Cargo, Passenger",
      gradient: "from-purple-500/20 to-pink-500/10",
    },
    {
      id: "truck",
      value: "Truck",
      icon: "🚚",
      label: "Truck",
      description: "Pickup, Delivery",
      gradient: "from-orange-500/20 to-red-500/10",
    },
    {
      id: "ev",
      value: "EV",
      icon: "⚡",
      label: "Electric",
      description: "Zero Emission",
      gradient: "from-green-500/20 to-emerald-500/10",
    },
    {
      id: "bike",
      value: "Bike",
      icon: "🏍️",
      label: "Motorcycle",
      description: "Two-Wheeler",
      gradient: "from-yellow-500/20 to-amber-500/10",
    },
  ];

  const handleRecommend = async () => {
    if (!form.startTime || !form.endTime) {
      alert("Please select start and end times");
      return;
    }

    try {
      setLoadingRecs(true);
      const params = {
        customerId: state.user?.id || localStorage.getItem("userId"),
        vehicleType: form.vehicleType || null,
        isEv: form.isEv,
        start: new Date(form.startTime).toISOString(),
        end: new Date(form.endTime).toISOString(),
        limit: 5,
      };
      const res = await bookingApi.getRecommendations(params);
      setRecs(res.data || res);
    } catch (err) {
      console.error(err);
      alert(
        "Recommendation failed: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleCreate = async (vehicleId = null) => {
    if (!form.startTime || !form.endTime || !form.pickupLocation) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        customerId: state.user?.id || localStorage.getItem("userId"),
        vehicleId: vehicleId || selectedRecommendation?.id,
        vehicleType: form.vehicleType,
        isEv: form.isEv,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        seats: form.seats,
        pickupLocation: form.pickupLocation,
        dropoffLocation: form.dropoffLocation,
      };
      const res = await bookingApi.createBooking(payload);
      dispatch({ type: actionTypes.CREATE_BOOKING, payload: res.data || res });

      // Reset form
      setForm({
        vehicleType: "",
        isEv: false,
        startTime: "",
        endTime: "",
        seats: 1,
        pickupLocation: "",
        dropoffLocation: "",
      });
      setRecs([]);
      setSelectedRecommendation(null);

      alert("✅ Booking created successfully!");
      if (onBookingCreated) onBookingCreated();
    } catch (err) {
      console.error(err);
      alert("Create failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
    >
      <h3 className="text-xl font-bold text-white mb-4">
        🚗 Create New Booking
      </h3>

      <div className="space-y-4">
        {/* Vehicle Type - Card Grid Selector */}
        <div>
          <label className="block text-white/80 text-sm mb-3 font-semibold">
            🚗 Select Vehicle Type
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {vehicleTypes.map((vehicle, index) => {
              const isSelected = form.vehicleType === vehicle.value;
              const isHovered = hoveredVehicleType === vehicle.id;

              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                  }}
                  onHoverStart={() => setHoveredVehicleType(vehicle.id)}
                  onHoverEnd={() => setHoveredVehicleType(null)}
                  whileHover={{ y: -5, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setForm({ ...form, vehicleType: vehicle.value })
                  }
                  className={`relative cursor-pointer group ${
                    isSelected ? "z-10" : "z-0"
                  }`}
                >
                  {/* Animated Background Glow */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${vehicle.gradient} rounded-xl blur-lg transition-opacity duration-500`}
                    animate={{
                      opacity: isSelected ? 1 : isHovered ? 0.5 : 0,
                      scale: isSelected ? 1.2 : isHovered ? 1.1 : 1,
                    }}
                  />

                  {/* Card Content */}
                  <motion.div
                    className={`relative backdrop-blur-xl border-2 rounded-xl p-3 transition-all duration-300 ${
                      isSelected
                        ? `bg-gradient-to-br ${vehicle.gradient} border-cyan-500/50 shadow-xl shadow-cyan-500/20`
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {/* Selected Check Badge */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg z-10"
                        >
                          <span className="text-white text-xs font-bold">
                            ✓
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Icon with Animation */}
                    <motion.div
                      animate={{
                        scale: isSelected ? [1, 1.15, 1] : isHovered ? 1.1 : 1,
                        rotate: isSelected ? [0, 8, -8, 0] : 0,
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: isSelected ? Infinity : 0,
                        repeatDelay: 2,
                      }}
                      className="text-3xl mb-1.5 text-center"
                    >
                      {vehicle.icon}
                    </motion.div>

                    {/* Label */}
                    <h4
                      className={`text-xs font-bold text-center mb-0.5 transition-colors ${
                        isSelected ? "text-white" : "text-white/80"
                      }`}
                    >
                      {vehicle.label}
                    </h4>

                    {/* Description */}
                    <p
                      className={`text-[10px] text-center transition-colors ${
                        isSelected ? "text-white/90" : "text-white/50"
                      }`}
                    >
                      {vehicle.description}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Vehicle Display */}
          <AnimatePresence>
            {form.vehicleType && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="mt-3 backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {
                      vehicleTypes.find((v) => v.value === form.vehicleType)
                        ?.icon
                    }
                  </span>
                  <div>
                    <p className="text-white font-semibold text-xs">
                      Selected: {form.vehicleType}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setForm({ ...form, vehicleType: "" })}
                  className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-xs hover:bg-red-500/30 transition-all"
                >
                  ✕
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* EV Checkbox - Enhanced */}
        <motion.div
          whileHover={{ x: 3 }}
          className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all cursor-pointer"
          onClick={() => setForm({ ...form, isEv: !form.isEv })}
        >
          <input
            type="checkbox"
            id="isEv"
            checked={form.isEv}
            onChange={(e) => setForm({ ...form, isEv: e.target.checked })}
            className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
          />
          <label
            htmlFor="isEv"
            className="text-white/80 text-sm font-semibold cursor-pointer flex-1"
          >
            ⚡ Prefer Electric Vehicle (EV)
          </label>
          {form.isEv && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold"
            >
              Eco-Friendly
            </motion.span>
          )}
        </motion.div>

        {/* Date Time Inputs - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-white/80 text-sm mb-2 font-semibold">
              🕐 Start Time
            </label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500 hover:border-white/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-2 font-semibold">
              🕑 End Time
            </label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500 hover:border-white/30 transition-all"
            />
          </div>
        </div>

        {/* Locations - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-white/80 text-sm mb-2 font-semibold">
              📍 Pickup Location
            </label>
            <input
              type="text"
              placeholder="Enter pickup location"
              value={form.pickupLocation}
              onChange={(e) =>
                setForm({ ...form, pickupLocation: e.target.value })
              }
              className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500 placeholder:text-white/40 hover:border-white/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-2 font-semibold">
              🎯 Dropoff Location
            </label>
            <input
              type="text"
              placeholder="Enter dropoff location"
              value={form.dropoffLocation}
              onChange={(e) =>
                setForm({ ...form, dropoffLocation: e.target.value })
              }
              className="w-full p-3 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:border-cyan-500 placeholder:text-white/40 hover:border-white/30 transition-all"
            />
          </div>
        </div>

        {/* Seats Selector - Enhanced with Visual Pills */}
        <div>
          <label className="block text-white/80 text-sm mb-3 font-semibold">
            👥 Number of Seats
          </label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((seatNum) => (
              <motion.button
                key={seatNum}
                type="button"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setForm({ ...form, seats: seatNum })}
                className={`w-12 h-12 rounded-xl font-bold text-sm transition-all ${
                  form.seats === seatNum
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white/10 text-white/60 border border-white/20 hover:border-white/40 hover:text-white"
                }`}
              >
                {seatNum}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRecommend}
            disabled={loadingRecs}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingRecs ? "🔄 Finding..." : "🤖 Get AI Recommendations"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCreate()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
          >
            📅 Book Now
          </motion.button>
        </div>
      </div>

      {/* AI Recommendations */}
      {recs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-6 space-y-3"
        >
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🤖</span> AI Recommended Vehicles
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {recs.map((v, index) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                onClick={() => setSelectedRecommendation(v)}
                className={`p-4 backdrop-blur-sm border rounded-xl cursor-pointer transition-all ${
                  selectedRecommendation?.id === v.id
                    ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                    : "bg-white/5 border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="text-lg font-bold text-white">
                        {v.name}
                      </div>
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full font-bold">
                        AI ✨
                      </span>
                    </div>
                    <div className="text-sm text-white/70 flex flex-wrap gap-3">
                      <span>🚗 {v.type || v.vehicleType}</span>
                      {v.batteryLevel !== undefined && (
                        <span>🔋 {Math.round(v.batteryLevel)}%</span>
                      )}
                      {v.fuelLevel !== undefined && (
                        <span>⛽ {Math.round(v.fuelLevel)}%</span>
                      )}
                    </div>
                    {v.matchScore && (
                      <div className="text-xs text-cyan-400 mt-1 font-semibold">
                        Match Score: {Math.round(v.matchScore * 100)}%
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreate(v.id);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-green-500/30 transition-all"
                  >
                    Book This
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
