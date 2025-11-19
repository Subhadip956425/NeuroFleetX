import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import routeApi from "../../api/routeApi";

// ✅ Map component to auto-center on vehicle
function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);

  return null;
}

// Custom marker icons
const vehicleIcon = L.divIcon({
  className: "custom-vehicle-marker",
  html: `<div style="background: #10b981; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
    <span style="font-size: 20px;">🚗</span>
  </div>`,
  iconSize: [40, 40],
});

const pickupIcon = L.divIcon({
  className: "custom-pickup-marker",
  html: `<div style="background: #3b82f6; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
    <span style="font-size: 18px;">📍</span>
  </div>`,
  iconSize: [35, 35],
});

const destinationIcon = L.divIcon({
  className: "custom-destination-marker",
  html: `<div style="background: #ef4444; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
    <span style="font-size: 18px;">🎯</span>
  </div>`,
  iconSize: [35, 35],
});

const LiveTripTracker = ({ booking }) => {
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [route1, setRoute1] = useState([]);
  const [route2, setRoute2] = useState([]);
  const [eta1, setEta1] = useState(null);
  const [eta2, setEta2] = useState(null);
  const [aiConfidence1, setAiConfidence1] = useState(null);
  const [aiConfidence2, setAiConfidence2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState("pending");
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]);

  // ✅ CRITICAL: Use pre-geocoded coordinates from booking if available
  const pickupCoords = booking.pickupCoords || [22.5726, 88.3639];
  const dropoffCoords = booking.dropoffCoords || [19.076, 72.8777];

  const trackingIntervalRef = useRef(null);
  const lastVehiclePosition = useRef(null);

  console.log("🎯 LiveTripTracker initialized with:");
  console.log("  Booking:", booking);
  console.log("  Pickup coords:", pickupCoords);
  console.log("  Dropoff coords:", dropoffCoords);

  // ✅ Start tracking immediately
  useEffect(() => {
    console.log("🚀 Starting vehicle tracking...");

    // Initial fetch
    fetchLiveData();

    // Set up interval
    trackingIntervalRef.current = setInterval(() => {
      console.log("🔄 Refreshing live data...");
      fetchLiveData();
    }, 15000);

    // Cleanup
    return () => {
      console.log("🛑 Stopping vehicle tracking");
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [booking.vehicleId]);

  // ✅ FIXED: Fetch live data with proper synchronization
  const fetchLiveData = async () => {
    try {
      console.log(
        "📡 Fetching live vehicle data for vehicle:",
        booking.vehicleId
      );

      // Step 1: Get vehicle location
      const locationResponse = await routeApi.getVehicleLiveLocation(
        booking.vehicleId
      );
      const vehicleLoc = locationResponse.data;

      console.log("✅ Vehicle location received:");
      console.log("  Position:", [vehicleLoc.latitude, vehicleLoc.longitude]);
      console.log("  Speed:", vehicleLoc.speed, "km/h");

      // ✅ Check if vehicle actually moved
      const hasMoved =
        !lastVehiclePosition.current ||
        Math.abs(lastVehiclePosition.current.latitude - vehicleLoc.latitude) >
          0.0001 ||
        Math.abs(lastVehiclePosition.current.longitude - vehicleLoc.longitude) >
          0.0001;

      // Always update vehicle location
      setVehicleLocation(vehicleLoc);
      setMapCenter([vehicleLoc.latitude, vehicleLoc.longitude]);

      if (hasMoved || !route1.length) {
        console.log("🚗 Vehicle moved or initial load, updating routes...");
        lastVehiclePosition.current = vehicleLoc;
        await fetchRouteData(vehicleLoc);
      } else {
        console.log("⏸️ Vehicle hasn't moved, skipping route recalculation");
      }
    } catch (error) {
      console.error("❌ Error fetching live data:", error);
      setLoading(false);
    }
  };

  const fetchRouteData = async (vehicleLoc) => {
    try {
      console.log("🗺️ Fetching routes:");
      console.log("  From vehicle:", [
        vehicleLoc.latitude,
        vehicleLoc.longitude,
      ]);
      console.log("  To pickup:", pickupCoords);
      console.log("  To dropoff:", dropoffCoords);

      // ✅ Get optimized route using LIVE vehicle location
      const optimizedRoute = await routeApi.getOptimizedLiveRoute(
        booking.vehicleId,
        pickupCoords[0],
        pickupCoords[1],
        dropoffCoords[0],
        dropoffCoords[1]
      );

      console.log("✅ Optimized route received:");
      console.log("  Segment 1 points:", optimizedRoute.segment1.route.length);
      console.log("  Segment 1 start:", optimizedRoute.segment1.route[0]);
      console.log("  Expected start:", [
        vehicleLoc.latitude,
        vehicleLoc.longitude,
      ]);

      // Update routes
      setRoute1(optimizedRoute.segment1.route);
      setRoute2(optimizedRoute.segment2.route);

      // Update ETAs
      setEta1(
        Math.round(optimizedRoute.segment1.aiPrediction.data.predicted_eta)
      );
      setEta2(
        Math.round(optimizedRoute.segment2.aiPrediction.data.predicted_eta)
      );
      setAiConfidence1(
        Math.round(optimizedRoute.segment1.aiPrediction.data.confidence * 100)
      );
      setAiConfidence2(
        Math.round(optimizedRoute.segment2.aiPrediction.data.confidence * 100)
      );

      // Determine trip status
      const distanceToPickup = calculateDistance(
        vehicleLoc.latitude,
        vehicleLoc.longitude,
        pickupCoords[0],
        pickupCoords[1]
      );

      console.log("📏 Distance to pickup:", distanceToPickup.toFixed(2), "km");

      if (distanceToPickup < 0.5) {
        setTripStatus("arrived_at_pickup");
      } else if (distanceToPickup < 5) {
        setTripStatus("approaching_pickup");
      } else {
        setTripStatus("en_route_to_pickup");
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching route data:", error);
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-4xl mb-4"
        >
          🔄
        </motion.div>
        <p className="text-white/60">Loading live trip data...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trip Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              {tripStatus === "en_route_to_pickup" && "🚗 Vehicle En Route"}
              {tripStatus === "approaching_pickup" && "📍 Approaching Pickup"}
              {tripStatus === "arrived_at_pickup" && "✅ Arrived at Pickup"}
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                🔴 LIVE
              </span>
            </h3>
            <p className="text-white/70">
              Booking ID: <span className="font-bold">#{booking.id}</span>
            </p>
            <p className="text-white/50 text-sm mt-1">
              ⚡ AI-powered tracking • Updates every 15 seconds
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl"
          >
            {tripStatus === "arrived_at_pickup" ? "🎉" : "🚀"}
          </motion.div>
        </div>
      </motion.div>

      {/* ETA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📍</span>
            <div className="flex-1">
              <p className="text-white/60 text-sm">Vehicle → Pickup</p>
              <p className="text-white font-semibold text-sm truncate">
                {booking.pickupLocation}
              </p>
            </div>
            {aiConfidence1 && (
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full font-bold">
                {aiConfidence1}%
              </span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-cyan-400">
              {eta1 || "—"}
            </span>
            <span className="text-white/60 text-lg mb-1">minutes</span>
          </div>
          <p className="text-white/50 text-xs mt-2">⚡ AI-predicted ETA</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎯</span>
            <div className="flex-1">
              <p className="text-white/60 text-sm">Pickup → Destination</p>
              <p className="text-white font-semibold text-sm truncate">
                {booking.dropoffLocation}
              </p>
            </div>
            {aiConfidence2 && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold">
                {aiConfidence2}%
              </span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-blue-400">
              {eta2 || "—"}
            </span>
            <span className="text-white/60 text-lg mb-1">minutes</span>
          </div>
          <p className="text-white/50 text-xs mt-2">⚡ AI-predicted ETA</p>
        </motion.div>
      </div>

      {/* Vehicle Details Card */}
      {vehicleLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">🚗 Vehicle Status</h3>
            <span className="text-xs text-white/40">
              Last update:{" "}
              {new Date(vehicleLocation.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-xs">Speed</p>
              <p className="text-white font-bold text-lg">
                {vehicleLocation.speed?.toFixed(0) || 0} km/h
              </p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-xs">Battery</p>
              <p className="text-green-400 font-bold text-lg">
                {vehicleLocation.batteryLevel?.toFixed(0) || 0}%
              </p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-xs">Fuel</p>
              <p className="text-blue-400 font-bold text-lg">
                {vehicleLocation.fuelLevel?.toFixed(0) || 0}%
              </p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-white/60 text-xs">Heading</p>
              <p className="text-purple-400 font-bold text-lg">
                {vehicleLocation.heading || 0}°
              </p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white/5 rounded-lg">
            <p className="text-white/60 text-xs mb-1">Current Position</p>
            <p className="text-white/80 text-sm font-mono">
              {vehicleLocation.latitude.toFixed(6)},{" "}
              {vehicleLocation.longitude.toFixed(6)}
            </p>
            {route1.length > 0 && (
              <p className="text-white/50 text-xs mt-1">
                Route starts: {route1[0][0].toFixed(6)},{" "}
                {route1[0][1].toFixed(6)}
                {Math.abs(route1[0][0] - vehicleLocation.latitude) < 0.01 &&
                Math.abs(route1[0][1] - vehicleLocation.longitude) < 0.01 ? (
                  <span className="text-green-400 ml-2">✓ Synced</span>
                ) : (
                  <span className="text-yellow-400 ml-2">
                    ⚠ Recalculating...
                  </span>
                )}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Live Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">📍 Live Tracking Map</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-white/60">Vehicle → Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-white/60">Pickup → Destination</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/20">
          <MapContainer
            center={mapCenter}
            zoom={8}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            <MapUpdater center={mapCenter} />

            {vehicleLocation && (
              <Marker
                position={[vehicleLocation.latitude, vehicleLocation.longitude]}
                icon={vehicleIcon}
              >
                <Popup>
                  <div>
                    <strong>🚗 Vehicle Location</strong>
                    <br />
                    <strong>Speed:</strong> {vehicleLocation.speed?.toFixed(0)}{" "}
                    km/h
                    <br />
                    <strong>ETA to pickup:</strong> {eta1} min
                    <br />
                    <strong>Battery:</strong>{" "}
                    {vehicleLocation.batteryLevel?.toFixed(0)}%
                    <br />
                    <strong>Position:</strong>{" "}
                    {vehicleLocation.latitude.toFixed(4)},{" "}
                    {vehicleLocation.longitude.toFixed(4)}
                  </div>
                </Popup>
              </Marker>
            )}

            <Marker position={pickupCoords} icon={pickupIcon}>
              <Popup>
                <strong>📍 Pickup Point</strong>
                <br />
                {booking.pickupLocation}
                <br />
                <strong>ETA:</strong> {eta1} min
              </Popup>
            </Marker>

            <Marker position={dropoffCoords} icon={destinationIcon}>
              <Popup>
                <strong>🎯 Destination</strong>
                <br />
                {booking.dropoffLocation}
                <br />
                <strong>ETA after pickup:</strong> {eta2} min
              </Popup>
            </Marker>

            {route1.length > 0 && (
              <Polyline
                positions={route1}
                color="#10b981"
                weight={5}
                opacity={0.8}
              />
            )}

            {route2.length > 0 && (
              <Polyline
                positions={route2}
                color="#3b82f6"
                weight={5}
                opacity={0.7}
                dashArray="15, 10"
              />
            )}
          </MapContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveTripTracker;
