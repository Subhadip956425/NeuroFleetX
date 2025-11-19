import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RouteInputForm from "../Route/RouteInputForm";
import AlternativeRoutesList from "../Route/AlternativeRoutesList";
import ETADisplay from "../Route/ETADisplay";
import TrafficLevelIndicator from "../Route/TrafficLevelIndicator";
import RouteMapView from "../Route/RouteMapView";
import bookingApi from "../../api/bookingApi";

const RouteOptimization = () => {
  const [step, setStep] = useState(1); // Step 1: Input, Step 2: Results
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [trafficLevel, setTrafficLevel] = useState(0.5); // 0.2 (Low), 0.5 (Medium), 0.8 (High)

  const handleRouteSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        distanceKm: formData.distance || 50,
        avgSpeed: formData.avgSpeed || 60,
        trafficLevel: formData.trafficLevel || 0.5,
        batteryLevel: formData.batteryLevel || 85,
        fuelLevel: formData.fuelLevel || 75,
      };

      const response = await bookingApi.predictETA(payload);

      setRouteData({
        ...formData,
        prediction: response.data,
        routes: response.data.alternative_routes || [],
      });

      setSelectedRoute(response.data.alternative_routes?.[0] || null);
      setStep(2);
    } catch (error) {
      console.error("❌ Error predicting ETA:", error);
      alert("Failed to predict ETA. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrafficChange = (newTraffic) => {
    setTrafficLevel(newTraffic);
    // Update routes based on new traffic level
    if (routeData?.routes) {
      const updatedRoutes = routeData.routes.map((route) => ({
        ...route,
        traffic_level: newTraffic,
      }));
      setRouteData({ ...routeData, routes: updatedRoutes });
    }
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
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
            🗺️ Route Optimization & ETA
          </h1>
          <p className="text-white/60">
            AI-powered route suggestions with real-time traffic prediction
          </p>
        </motion.div>

        {/* Step Indicator */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center justify-between"
          >
            <div className="text-white/60 text-sm">
              📍 {routeData?.pickupLocation} → {routeData?.dropoffLocation}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
            >
              ← Change Route
            </motion.button>
          </motion.div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <RouteInputForm onSubmit={handleRouteSubmit} loading={loading} />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left: Map & Selected Route */}
              <div className="lg:col-span-2 space-y-6">
                <RouteMapView route={selectedRoute} routeData={routeData} />
                <ETADisplay route={selectedRoute} />
              </div>

              {/* Right: Route Options & Traffic */}
              <div className="space-y-6">
                <TrafficLevelIndicator
                  currentLevel={trafficLevel}
                  onChange={handleTrafficChange}
                />
                <AlternativeRoutesList
                  routes={routeData?.routes || []}
                  selectedRoute={selectedRoute}
                  onSelectRoute={handleRouteSelect}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RouteOptimization;
