import React, { useState } from "react";
import { motion } from "framer-motion";

const RouteInputForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    pickupLocation: "",
    dropoffLocation: "",
    distance: 50,
    avgSpeed: 60,
    trafficLevel: 0.5,
    batteryLevel: 85,
    fuelLevel: 75,
    vehicleId: 1,
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.pickupLocation || !formData.dropoffLocation) {
      alert("Please enter both pickup and dropoff locations");
      return;
    }
    onSubmit(formData);
  };

  const trafficOptions = [
    { value: 0.2, label: "Low Traffic 🟢", description: "Light traffic flow" },
    { value: 0.5, label: "Medium Traffic 🟡", description: "Moderate traffic" },
    { value: 0.8, label: "High Traffic 🔴", description: "Heavy congestion" },
  ];

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8"
    >
      {/* Locations */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">📍 Route Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">
              Pickup Location *
            </label>
            <input
              type="text"
              name="pickupLocation"
              placeholder="Enter pickup address"
              value={formData.pickupLocation}
              onChange={handleChange}
              required
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">
              Dropoff Location *
            </label>
            <input
              type="text"
              name="dropoffLocation"
              placeholder="Enter dropoff address"
              value={formData.dropoffLocation}
              onChange={handleChange}
              required
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Route Parameters */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">⚙️ Route Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">
              Distance:{" "}
              <span className="text-cyan-400">{formData.distance} km</span>
            </label>
            <input
              type="range"
              name="distance"
              min="5"
              max="300"
              value={formData.distance}
              onChange={handleChange}
              className="w-full"
            />
            <input
              type="number"
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              className="w-full mt-2 bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Avg Speed:{" "}
              <span className="text-cyan-400">{formData.avgSpeed} km/h</span>
            </label>
            <input
              type="range"
              name="avgSpeed"
              min="10"
              max="120"
              value={formData.avgSpeed}
              onChange={handleChange}
              className="w-full"
            />
            <input
              type="number"
              name="avgSpeed"
              value={formData.avgSpeed}
              onChange={handleChange}
              className="w-full mt-2 bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Vehicle Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">🔋 Vehicle Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">
              Battery Level:{" "}
              <span className="text-cyan-400">{formData.batteryLevel}%</span>
            </label>
            <input
              type="range"
              name="batteryLevel"
              min="0"
              max="100"
              value={formData.batteryLevel}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Fuel Level:{" "}
              <span className="text-cyan-400">{formData.fuelLevel}%</span>
            </label>
            <input
              type="range"
              name="fuelLevel"
              min="0"
              max="100"
              value={formData.fuelLevel}
              onChange={handleChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Traffic Level */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">🚗 Expected Traffic</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {trafficOptions.map((option) => (
            <motion.label
              key={option.value}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${
                formData.trafficLevel === option.value
                  ? "bg-cyan-500/20 border-cyan-500"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="trafficLevel"
                value={option.value}
                checked={formData.trafficLevel === option.value}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-white font-semibold">{option.label}</span>
              <p className="text-white/60 text-sm mt-1">{option.description}</p>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 text-lg"
      >
        {loading ? "🔄 Optimizing Route..." : "🚀 Get Route & ETA"}
      </motion.button>
    </motion.form>
  );
};

export default RouteInputForm;
