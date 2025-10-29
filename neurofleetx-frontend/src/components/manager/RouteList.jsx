import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import routeApi from "../../api/routeApi";
import vehicleApi from "../../api/vehicleApi";
import axiosInstance from "../../api/axiosInstance";

export default function RouteList({ routes, onUpdated }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const vehiclesRes = await vehicleApi.getAll();
      setVehicles(vehiclesRes.data || vehiclesRes);

      const driversRes = await axiosInstance.get("/users?role=DRIVER");
      setDrivers(driversRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const handleAssign = async (routeId) => {
    const assignment = assignments[routeId];
    if (!assignment?.driverId || !assignment?.vehicleId) {
      alert("Please select both driver and vehicle");
      return;
    }

    try {
      await routeApi.assignRoute(
        routeId,
        assignment.driverId,
        assignment.vehicleId
      );
      alert("Route assigned successfully!");
      onUpdated();
    } catch (err) {
      console.error("Assignment failed:", err);
      alert("Failed to assign route");
    }
  };

  const updateAssignment = (routeId, field, value) => {
    setAssignments((prev) => ({
      ...prev,
      [routeId]: { ...prev[routeId], [field]: value },
    }));
  };

  if (routes.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-2xl font-bold text-white mb-2">No Routes Yet</h3>
        <p className="text-white/60">Create a route to get started</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-6">Route Assignments</h3>

      <div className="space-y-4">
        {routes.map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-bold text-lg">
                    📍 {route.origin} → {route.destination}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      route.status === "ASSIGNED"
                        ? "bg-green-500/20 text-green-400"
                        : route.status === "COMPLETED"
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {route.status}
                  </span>
                </div>

                <div className="flex gap-4 text-sm text-white/60">
                  <span>
                    ⏱️ ETA:{" "}
                    {route.predictedEta
                      ? `${Math.round(route.predictedEta)} mins`
                      : "N/A"}
                  </span>
                  {route.distanceKm && <span>📏 {route.distanceKm} km</span>}
                </div>
              </div>
            </div>

            {route.status !== "ASSIGNED" && route.status !== "COMPLETED" && (
              <div className="flex gap-3 flex-wrap">
                <select
                  value={assignments[route.id]?.driverId || ""}
                  onChange={(e) =>
                    updateAssignment(route.id, "driverId", e.target.value)
                  }
                  className="flex-1 p-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-gray-800">
                    Select Driver
                  </option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id} className="bg-gray-800">
                      {d.fullName || d.username}
                    </option>
                  ))}
                </select>

                <select
                  value={assignments[route.id]?.vehicleId || ""}
                  onChange={(e) =>
                    updateAssignment(route.id, "vehicleId", e.target.value)
                  }
                  className="flex-1 p-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-gray-800">
                    Select Vehicle
                  </option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-gray-800">
                      {v.name}
                    </option>
                  ))}
                </select>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAssign(route.id)}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Assign
                </motion.button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
