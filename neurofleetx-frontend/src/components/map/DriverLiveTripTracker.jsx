import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import bookingApi from "../../api/bookingApi";

// Custom marker icons
const driverVehicleIcon = L.divIcon({
  className: "custom-driver-vehicle-marker",
  html: `<div style="background: #f59e0b; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 15px rgba(245,158,11,0.5);">
    <span style="font-size: 24px;">🚚</span>
  </div>`,
  iconSize: [45, 45],
});

const customerPickupIcon = L.divIcon({
  className: "custom-customer-pickup-marker",
  html: `<div style="background: #3b82f6; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(59,130,246,0.5);">
    <span style="font-size: 20px;">👤</span>
  </div>`,
  iconSize: [40, 40],
});

const dropoffIcon = L.divIcon({
  className: "custom-dropoff-marker",
  html: `<div style="background: #10b981; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(16,185,129,0.5);">
    <span style="font-size: 20px;">🎯</span>
  </div>`,
  iconSize: [40, 40],
});

const DriverLiveTripTracker = ({ booking, onClose }) => {
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [route1, setRoute1] = useState([]); // Vehicle → Pickup
  const [route2, setRoute2] = useState([]); // Pickup → Dropoff
  const [eta1, setEta1] = useState(null); // ETA to pickup
  const [eta2, setEta2] = useState(null); // ETA to dropoff
  const [aiConfidence1, setAiConfidence1] = useState(null);
  const [aiConfidence2, setAiConfidence2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState("preparing");
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]);
  const [totalDistance, setTotalDistance] = useState(0);

  const updateIntervalRef = useRef(null);
  const hasInitialized = useRef(false);

  // Get pickup and dropoff coordinates (from booking or geocoded)
  const pickupCoords = booking.pickupCoords || [22.5726, 88.3639];
  const dropoffCoords = booking.dropoffCoords || [19.076, 72.8777];

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchDriverLiveData();

      // Update every 15 seconds for driver
      updateIntervalRef.current = setInterval(() => {
        console.log("🔄 Driver: Auto-refreshing trip data...");
        fetchDriverLiveData();
      }, 15000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const fetchDriverLiveData = async () => {
    try {
      console.log(
        "📍 Driver: Fetching live trip data for booking:",
        booking.id
      );

      // Get driver's vehicle current location
      const locationResponse = await bookingApi.getVehicleLiveLocation(
        booking.vehicleId
      );
      const vehicleLoc = locationResponse.data;

      setVehicleLocation(vehicleLoc);
      setMapCenter([vehicleLoc.latitude, vehicleLoc.longitude]);

      // Route 1: Vehicle → Customer Pickup with AI ETA
      const route1Data = await getRealRouteWithAI(
        vehicleLoc.latitude,
        vehicleLoc.longitude,
        pickupCoords[0],
        pickupCoords[1],
        vehicleLoc
      );

      setRoute1(route1Data.route);
      setEta1(route1Data.eta);
      setAiConfidence1(route1Data.confidence);

      console.log(
        `✅ Driver Route 1: ${route1Data.route.length} waypoints, AI ETA: ${route1Data.eta} min`
      );

      // Route 2: Customer Pickup → Dropoff with AI ETA
      const route2Data = await getRealRouteWithAI(
        pickupCoords[0],
        pickupCoords[1],
        dropoffCoords[0],
        dropoffCoords[1],
        vehicleLoc
      );

      setRoute2(route2Data.route);
      setEta2(route2Data.eta);
      setAiConfidence2(route2Data.confidence);

      console.log(
        `✅ Driver Route 2: ${route2Data.route.length} waypoints, AI ETA: ${route2Data.eta} min`
      );

      // Calculate total distance
      const dist1 = parseFloat(route1Data.distance || 0);
      const dist2 = parseFloat(route2Data.distance || 0);
      setTotalDistance(dist1 + dist2);

      // Determine trip status
      const distanceToPickup = calculateDistance(
        vehicleLoc.latitude,
        vehicleLoc.longitude,
        pickupCoords[0],
        pickupCoords[1]
      );

      if (distanceToPickup < 0.1) {
        setTripStatus("at_pickup");
      } else if (distanceToPickup < 1) {
        setTripStatus("approaching_pickup");
      } else {
        setTripStatus("en_route_to_pickup");
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Driver: Error fetching live trip data:", error);
      setLoading(false);
    }
  };

  const getRealRouteWithAI = async (lat1, lng1, lat2, lng2, vehicleData) => {
    try {
      const routeData = await bookingApi.getRealRoute(lat1, lng1, lat2, lng2);

      if (
        routeData.code !== "Ok" ||
        !routeData.routes ||
        routeData.routes.length === 0
      ) {
        throw new Error("No route found");
      }

      const coordinates = routeData.routes[0].geometry.coordinates;
      const route = coordinates.map((coord) => [coord[1], coord[0]]);
      const distanceKm = routeData.routes[0].distance / 1000;

      // Get AI-predicted ETA
      const aiEtaResponse = await bookingApi.getAIPredictedETA({
        distanceKm: distanceKm,
        avgSpeed: 50,
        trafficLevel: 0.5,
        batteryLevel: vehicleData?.batteryLevel || 80,
        fuelLevel: vehicleData?.fuelLevel || 75,
      });

      const aiEta = aiEtaResponse.data.predicted_eta;
      const confidence = aiEtaResponse.data.confidence;

      return {
        route,
        eta: Math.round(aiEta),
        confidence: Math.round(confidence * 100),
        distance: distanceKm.toFixed(1),
      };
    } catch (error) {
      console.warn("⚠️ Fallback route generation");
      return generateSmartRoute(lat1, lng1, lat2, lng2);
    }
  };

  const generateSmartRoute = (lat1, lng1, lat2, lng2) => {
    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    const steps = Math.max(50, Math.floor(distance * 10));
    const route = [];

    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const curveOffset = distance * 0.1;

    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const t = ratio;
      const invT = 1 - t;
      const controlLat = midLat + curveOffset * Math.sin(Math.PI * ratio);
      const controlLng = midLng + curveOffset * Math.cos(Math.PI * ratio);
      const lat = invT * invT * lat1 + 2 * invT * t * controlLat + t * t * lat2;
      const lng = invT * invT * lng1 + 2 * invT * t * controlLng + t * t * lng2;
      route.push([lat, lng]);
    }

    const eta = Math.round((distance / 45) * 60);
    return { route, eta, confidence: 70, distance: distance.toFixed(1) };
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
        <div className="text-4xl mb-4">🔄</div>
        <p className="text-white/60">Loading live navigation...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trip Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">
              {tripStatus === "en_route_to_pickup" && "🚚 En Route to Customer"}
              {tripStatus === "approaching_pickup" && "📍 Approaching Customer"}
              {tripStatus === "at_pickup" && "✅ At Pickup Location"}
            </h3>
            <p className="text-white/70">
              Booking ID: <span className="font-bold">#{booking.id}</span>
            </p>
            <p className="text-white/50 text-sm mt-1">
              ⚡ AI-powered navigation • Updates every 15s
            </p>
          </div>
          <div className="text-right">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl mb-2"
            >
              {tripStatus === "at_pickup" ? "🎉" : "🚀"}
            </motion.div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </motion.div>

      {/* Navigation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Segment 1: To Pickup */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👤</span>
            <div className="flex-1">
              <p className="text-white/60 text-sm">To Customer Pickup</p>
              <p className="text-white font-semibold text-sm truncate">
                {booking.pickupLocation}
              </p>
            </div>
            {aiConfidence1 && (
              <span className="text-xs text-amber-400 font-bold bg-amber-500/20 px-2 py-1 rounded-full">
                {aiConfidence1}%
              </span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-amber-400">
              {eta1 || "—"}
            </span>
            <span className="text-white/60 text-lg mb-1">min</span>
          </div>
        </motion.div>

        {/* Segment 2: To Dropoff */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎯</span>
            <div className="flex-1">
              <p className="text-white/60 text-sm">To Dropoff</p>
              <p className="text-white font-semibold text-sm truncate">
                {booking.dropoffLocation}
              </p>
            </div>
            {aiConfidence2 && (
              <span className="text-xs text-green-400 font-bold bg-green-500/20 px-2 py-1 rounded-full">
                {aiConfidence2}%
              </span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-green-400">
              {eta2 || "—"}
            </span>
            <span className="text-white/60 text-lg mb-1">min</span>
          </div>
        </motion.div>

        {/* Total Trip */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-white/60 text-sm">Total Trip</p>
              <p className="text-white font-semibold text-sm">
                {totalDistance.toFixed(1)} km
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-cyan-400">
              {(eta1 || 0) + (eta2 || 0)}
            </span>
            <span className="text-white/60 text-lg mb-1">min</span>
          </div>
        </motion.div>
      </div>

      {/* Live Navigation Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">🗺️ Live Navigation</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-400 rounded"></div>
              <span className="text-white/60 text-sm">To Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span className="text-white/60 text-sm">To Dropoff</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-amber-400 text-sm font-semibold">LIVE</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/20">
          <MapContainer
            center={mapCenter}
            zoom={7}
            style={{ height: "600px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />

            {/* Driver's Vehicle */}
            {vehicleLocation && (
              <Marker
                position={[vehicleLocation.latitude, vehicleLocation.longitude]}
                icon={driverVehicleIcon}
              >
                <Popup>
                  <strong>🚚 Your Vehicle</strong>
                  <br />
                  ETA to customer: {eta1} min
                  <br />
                  Speed: {vehicleLocation.speed || 0} km/h
                </Popup>
              </Marker>
            )}

            {/* Customer Pickup Location */}
            <Marker position={pickupCoords} icon={customerPickupIcon}>
              <Popup>
                <strong>👤 Customer Pickup</strong>
                <br />
                {booking.pickupLocation}
                <br />
                ETA: {eta1} min
              </Popup>
            </Marker>

            {/* Dropoff Location */}
            <Marker position={dropoffCoords} icon={dropoffIcon}>
              <Popup>
                <strong>🎯 Dropoff Point</strong>
                <br />
                {booking.dropoffLocation}
                <br />
                ETA after pickup: {eta2} min
              </Popup>
            </Marker>

            {/* Route 1: Vehicle → Customer Pickup (Amber) */}
            {route1.length > 0 && (
              <Polyline
                positions={route1}
                color="#f59e0b"
                weight={6}
                opacity={0.9}
              />
            )}

            {/* Route 2: Pickup → Dropoff (Green Dashed) */}
            {route2.length > 0 && (
              <Polyline
                positions={route2}
                color="#10b981"
                weight={5}
                opacity={0.7}
                dashArray="15, 10"
              />
            )}
          </MapContainer>
        </div>
      </motion.div>

      {/* Customer Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-white font-bold mb-4">👤 Customer Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-sm">Customer ID</p>
            <p className="text-white font-semibold">{booking.customerId}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Vehicle Type</p>
            <p className="text-white font-semibold">{booking.vehicleType}</p>
          </div>
          <div className="col-span-2">
            <p className="text-white/60 text-sm mb-2">Trip Timeline</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">●</span>
                <span className="text-white text-sm">
                  Pickup:{" "}
                  {booking.startTime
                    ? new Date(booking.startTime).toLocaleString()
                    : "Scheduled"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">●</span>
                <span className="text-white text-sm">
                  Dropoff: ~{eta2} min after pickup
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DriverLiveTripTracker;
