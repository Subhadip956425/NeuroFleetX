import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axiosInstance from "../../api/axiosInstance";
import bookingApi from "../../api/bookingApi";
import locationApi from "../../api/locationApi";
import RouteMap from "../map/RouteMap";
import ETADisplay from "../Route/ETADisplay";
import DriverLiveTripTracker from "../map/DriverLiveTripTracker"; // ✅ ADD THIS

export default function DriverRouteDashboard() {
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [showLiveTracking, setShowLiveTracking] = useState(false); // ✅ ADD THIS

  const driverId = localStorage.getItem("userId");
  const driverRole = localStorage.getItem("role");

  console.log("🔍 DEBUG - driverId:", driverId, "driverRole:", driverRole);

  useEffect(() => {
    if (driverId && driverRole === "DRIVER") {
      loadDriverData();
      const interval = setInterval(loadDriverData, 10000);
      return () => clearInterval(interval);
    } else {
      setError("⚠️ Not a driver or ID missing");
    }
  }, [driverId, driverRole]);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching driver data...");

      try {
        const bookingsRes = await bookingApi.getConfirmedBookings();
        console.log("✅ Confirmed bookings loaded:", bookingsRes.data);
        setConfirmedBookings(bookingsRes.data || []);

        if (bookingsRes.data && bookingsRes.data.length > 0) {
          const convertedRoutes = bookingsRes.data.map((booking) => ({
            id: booking.id,
            bookingId: booking.id,
            pickupLocation: booking.pickupLocation,
            dropoffLocation: booking.dropoffLocation,
            status: "ASSIGNED",
            distanceKm: booking.distance || 0,
            estimatedTimeMinutes: booking.duration || 0,
            driverId: driverId,
            vehicleType: booking.vehicleType,
            startTime: booking.startTime,
            endTime: booking.endTime,
            customerId: booking.customerId,
            vehicleId: booking.vehicleId,
            isEv: booking.isEv,
          }));
          console.log("✅ Converted routes from bookings:", convertedRoutes);
          setRoutes(convertedRoutes);
        }
      } catch (bookingErr) {
        console.error(
          "❌ Error fetching confirmed bookings:",
          bookingErr.message
        );
        setError(`Bookings Error: ${bookingErr.message}`);
      }
    } catch (error) {
      console.error("❌ Error loading driver data:", error);
      setError(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadRouteCoordinates = async (route) => {
    try {
      setGeocodingInProgress(true);
      console.log("📍 Geocoding locations for route:", route.id);

      const [pickupCoords, dropoffCoords] = await Promise.all([
        locationApi.geocodeLocation(route.pickupLocation),
        locationApi.geocodeLocation(route.dropoffLocation),
      ]);

      if (!pickupCoords || !dropoffCoords) {
        console.warn("⚠️ Could not geocode one or both locations");
        return null;
      }

      console.log("✅ Pickup coords:", pickupCoords);
      console.log("✅ Dropoff coords:", dropoffCoords);

      const routeInfo = await locationApi.getRouteInfo(
        pickupCoords.lat,
        pickupCoords.lng,
        dropoffCoords.lat,
        dropoffCoords.lng
      );

      if (!routeInfo) {
        console.warn("⚠️ Could not fetch route info");
      }

      return {
        originLat: pickupCoords.lat,
        originLng: pickupCoords.lng,
        destinationLat: dropoffCoords.lat,
        destinationLng: dropoffCoords.lng,
        pickupCoords: [pickupCoords.lat, pickupCoords.lng], // ✅ For LiveTripTracker
        dropoffCoords: [dropoffCoords.lat, dropoffCoords.lng], // ✅ For LiveTripTracker
        geometry: routeInfo?.geometry || [],
        distanceKm: routeInfo?.distanceKm || route.distanceKm,
        estimatedTimeMinutes:
          routeInfo?.durationMinutes || route.estimatedTimeMinutes,
      };
    } catch (error) {
      console.error("❌ Error loading route coordinates:", error);
      return null;
    } finally {
      setGeocodingInProgress(false);
    }
  };

  const handleSelectRoute = async (route) => {
    try {
      setSelectedRoute(route);
      setShowLiveTracking(false); // ✅ Reset live tracking when selecting new route
      console.log("🔎 Selecting route:", route);

      const coordinates = await loadRouteCoordinates(route);

      const routeData = {
        id: route.id,
        pickupLocation: route.pickupLocation,
        dropoffLocation: route.dropoffLocation,
        distance: route.distanceKm || 0,
        distanceKm: route.distanceKm || 0,
        estimatedTime: route.estimatedTimeMinutes || 0,
        estimatedTimeMinutes: route.estimatedTimeMinutes || 0,
        status: route.status,
        vehicleType: route.vehicleType,
        customerId: route.customerId, // ✅ Pass customer ID
        vehicleId: route.vehicleId, // ✅ Pass vehicle ID
        startTime: route.startTime,
        endTime: route.endTime,
        isEv: route.isEv,
        ...coordinates,
      };

      console.log("📊 Route data with coordinates:", routeData);
      setRouteDetails(routeData);
    } catch (error) {
      console.error("❌ Error selecting route:", error);
      setError(error.message);
    }
  };

  const handleStartRoute = async (routeId) => {
    try {
      console.log("🚀 Starting route:", routeId);
      const res = await axiosInstance.put(`/api/routes/${routeId}/start`);
      console.log("✅ Route started:", res.data);
      setSelectedRoute(res.data);
      loadDriverData();
      alert("✅ Route started! Safe travels!");
    } catch (error) {
      console.error("❌ Error starting route:", error);
      alert(
        "❌ Failed to start route: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleCompleteRoute = async (routeId) => {
    try {
      console.log("🏁 Completing route:", routeId);
      const res = await axiosInstance.put(`/api/routes/${routeId}/complete`);
      console.log("✅ Route completed:", res.data);
      loadDriverData();
      setShowLiveTracking(false); // ✅ Close live tracking on completion
      alert("✅ Route completed successfully!");
    } catch (error) {
      console.error("❌ Error completing route:", error);
      alert(
        "❌ Failed to complete route: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  if (driverRole !== "DRIVER") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center rounded-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
        >
          <div className="text-white text-2xl mb-4">❌ Access Denied</div>
          <div className="text-cyan-300">Only drivers can access this page</div>
          <div className="text-white/60 text-sm mt-2">
            Current role: {driverRole || "None"}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          🚗 My Active Routes
        </h1>
        <p className="text-cyan-300">
          View assigned bookings with optimized routes and ETAs
        </p>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 flex justify-between items-center"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Routes/Bookings List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                📋 Assigned Bookings
              </h2>
              <button
                onClick={loadDriverData}
                disabled={loading || geocodingInProgress}
                className="text-cyan-300 hover:text-cyan-200 disabled:text-cyan-500"
                title="Refresh data"
              >
                🔄
              </button>
            </div>

            {loading ? (
              <div className="text-center text-cyan-300">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block text-2xl mb-2"
                >
                  ⏳
                </motion.div>
                <p>Loading routes...</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center text-white/60 py-8">
                <p className="text-lg">No active routes yet 😴</p>
                <p className="text-sm mt-2">
                  Confirmed bookings: {confirmedBookings.length}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {routes.map((route) => (
                  <motion.div
                    key={route.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleSelectRoute(route)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      selectedRoute?.id === route.id
                        ? "bg-cyan-500/20 border-cyan-500/50"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm truncate">
                          📍 {route.pickupLocation?.substring(0, 20)}
                        </p>
                        <p className="text-cyan-300 text-xs mt-1 truncate">
                          🎯 {route.dropoffLocation?.substring(0, 20)}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-bold whitespace-nowrap bg-blue-500/20 text-blue-300">
                        {route.status}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-white/60">
                        📏 {route.distanceKm?.toFixed(1) || 0} km
                      </span>
                      <span className="text-cyan-300 font-bold">
                        ⏱️ {route.estimatedTimeMinutes?.toFixed(0) || 0} min
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Route Details View / Live Tracking */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          {selectedRoute && routeDetails ? (
            <>
              {/* ✅ LIVE TRACKING VIEW */}
              {showLiveTracking ? (
                <DriverLiveTripTracker
                  booking={{
                    ...selectedRoute,
                    ...routeDetails,
                  }}
                  onClose={() => setShowLiveTracking(false)}
                />
              ) : (
                /* ✅ ROUTE DETAILS VIEW */
                <div className="space-y-6">
                  {/* Loading indicator while geocoding */}
                  {geocodingInProgress && (
                    <div className="fixed top-4 right-4 bg-amber-500/20 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-lg flex items-center gap-2 z-50">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ⏳
                      </motion.div>
                      <span>Fetching coordinates...</span>
                    </div>
                  )}

                  {/* Map View */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                  >
                    <h3 className="text-white font-bold mb-4">🗺️ Route Map</h3>
                    <RouteMap
                      routes={[
                        {
                          id: selectedRoute.id,
                          pickupLocation: selectedRoute.pickupLocation,
                          dropoffLocation: selectedRoute.dropoffLocation,
                          status: selectedRoute.status,
                          origin: selectedRoute.pickupLocation,
                          destination: selectedRoute.dropoffLocation,
                          originLat: routeDetails.originLat,
                          originLng: routeDetails.originLng,
                          destinationLat: routeDetails.destinationLat,
                          destinationLng: routeDetails.destinationLng,
                          geometry: routeDetails.geometry,
                        },
                      ]}
                      vehicles={[]}
                      height="400px"
                      showOriginDestination={true}
                    />
                  </motion.div>

                  {/* Route Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                  >
                    <h3 className="text-white font-bold mb-4">
                      📊 Route Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-white/60 text-sm">Distance</p>
                        <p className="text-white font-bold text-lg">
                          {(
                            routeDetails.distanceKm ||
                            selectedRoute.distanceKm ||
                            0
                          ).toFixed(1)}{" "}
                          km
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-white/60 text-sm">Estimated Time</p>
                        <p className="text-white font-bold text-lg">
                          {(
                            routeDetails.estimatedTimeMinutes ||
                            selectedRoute.estimatedTimeMinutes ||
                            0
                          ).toFixed(0)}{" "}
                          min
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg col-span-2">
                        <p className="text-white/60 text-sm mb-1">From</p>
                        <p className="text-cyan-300 font-semibold truncate">
                          📍 {selectedRoute.pickupLocation}
                        </p>
                        {routeDetails.originLat && (
                          <p className="text-white/40 text-xs">
                            ({routeDetails.originLat.toFixed(4)},{" "}
                            {routeDetails.originLng.toFixed(4)})
                          </p>
                        )}
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg col-span-2">
                        <p className="text-white/60 text-sm mb-1">To</p>
                        <p className="text-cyan-300 font-semibold truncate">
                          🎯 {selectedRoute.dropoffLocation}
                        </p>
                        {routeDetails.destinationLat && (
                          <p className="text-white/40 text-xs">
                            ({routeDetails.destinationLat.toFixed(4)},{" "}
                            {routeDetails.destinationLng.toFixed(4)})
                          </p>
                        )}
                      </div>
                      <div className="bg-white/5 p-4 rounded-lg col-span-2">
                        <p className="text-white/60 text-sm mb-1">
                          Vehicle Type
                        </p>
                        <p className="text-white font-semibold">
                          🚗 {selectedRoute.vehicleType || "Unknown"}{" "}
                          {selectedRoute.isEv ? "🔌 EV" : ""}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Booking Timeline */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                  >
                    <h3 className="text-white font-bold mb-4">🕐 Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🚀</div>
                        <div>
                          <p className="text-white/60 text-xs">Start Time</p>
                          <p className="text-white font-semibold">
                            {selectedRoute.startTime
                              ? new Date(
                                  selectedRoute.startTime
                                ).toLocaleString()
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🏁</div>
                        <div>
                          <p className="text-white/60 text-xs">End Time</p>
                          <p className="text-white font-semibold">
                            {selectedRoute.endTime
                              ? new Date(selectedRoute.endTime).toLocaleString()
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* ✅ LIVE NAVIGATION BUTTON */}
                    <button
                      onClick={() => setShowLiveTracking(true)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      🗺️ Start Live Navigation
                    </button>

                    <div className="flex gap-4">
                      {selectedRoute.status === "ASSIGNED" && (
                        <button
                          onClick={() => handleStartRoute(selectedRoute.id)}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all"
                        >
                          ✅ Start Route
                        </button>
                      )}
                      {selectedRoute.status === "IN_TRANSIT" && (
                        <button
                          onClick={() => handleCompleteRoute(selectedRoute.id)}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                        >
                          🏁 Complete Route
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRoute(null);
                          setRouteDetails(null);
                        }}
                        className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                      >
                        ← Back
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/60 text-lg">
                👈 Select a route to view details
              </p>
              <p className="text-white/40 text-sm mt-2">
                {routes.length > 0
                  ? "Click on a booking to fetch real coordinates"
                  : "No routes available"}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
