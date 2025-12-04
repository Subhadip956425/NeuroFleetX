import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ✅ Custom marker icons
const originIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const destinationIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const vehicleIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -34],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function RouteMap({
  routes = [],
  vehicles = [],
  height = "500px",
  showOriginDestination = true,
  showETA = true, // ✅ NEW: Show ETA information
}) {
  const defaultCenter = [28.6139, 77.209];

  const getCenter = () => {
    if (routes && routes.length > 0) {
      const firstRoute = routes[0];
      if (firstRoute.geometry && firstRoute.geometry.length > 0) {
        const [lat, lng] = firstRoute.geometry[0];
        return [lat, lng];
      }
      if (firstRoute.originLat && firstRoute.originLng) {
        return [firstRoute.originLat, firstRoute.originLng];
      }
      if (firstRoute.origin && typeof firstRoute.origin === "string") {
        const coords = firstRoute.origin.split(",").map(Number);
        if (coords.length === 2) return coords;
      }
    }
    if (vehicles && vehicles.length > 0) {
      return [vehicles[0].latitude || 0, vehicles[0].longitude || 0];
    }
    return defaultCenter;
  };

  const center = getCenter();

  const getRouteCoordinates = (route) => {
    try {
      if (
        route.geometry &&
        Array.isArray(route.geometry) &&
        route.geometry.length > 0
      ) {
        return route.geometry;
      }
      if (
        route.originLat &&
        route.originLng &&
        route.destinationLat &&
        route.destinationLng
      ) {
        return [
          [route.originLat, route.originLng],
          [route.destinationLat, route.destinationLng],
        ];
      }
      if (route.origin && route.destination) {
        const originCoords = route.origin.split(",").map(Number);
        const destCoords = route.destination.split(",").map(Number);
        if (
          originCoords.length === 2 &&
          destCoords.length === 2 &&
          !isNaN(originCoords[0]) &&
          !isNaN(destCoords[0])
        ) {
          return [originCoords, destCoords];
        }
      }
      return [];
    } catch (e) {
      console.warn("⚠️ Could not parse route coordinates:", e);
      return [];
    }
  };

  const getRouteColor = (status) => {
    const statusMap = {
      ASSIGNED: "#10b981", // Green
      IN_PROGRESS: "#f59e0b", // Amber
      IN_TRANSIT: "#f59e0b", // Amber
      COMPLETED: "#6b7280", // Gray
      default: "#3b82f6", // Blue
    };
    return statusMap[status] || statusMap.default;
  };

  // ✅ Format ETA to display
  const formatETA = (minutes) => {
    if (!minutes) return "N/A";
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  console.log("🗺️ RouteMap - routes:", routes);
  console.log("🗺️ RouteMap - vehicles:", vehicles);
  console.log("🗺️ Center:", center);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height, width: "100%" }}
        className="z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* ✅ Render route polylines */}
        {routes &&
          routes.map((route) => {
            const path = getRouteCoordinates(route);
            const color = getRouteColor(route.status);

            const originCoords = path[0];
            const destCoords = path[path.length - 1];

            return (
              <React.Fragment key={route.id || Math.random()}>
                {/* Polyline */}
                {path && path.length > 1 && (
                  <Polyline
                    positions={path}
                    color={color}
                    weight={4}
                    opacity={0.8}
                    dashArray={route.status === "COMPLETED" ? "5, 5" : "none"}
                  />
                )}

                {/* Origin Marker */}
                {showOriginDestination && originCoords && (
                  <Marker position={originCoords} icon={originIcon}>
                    <Popup className="custom-popup">
                      <div className="p-2 bg-white rounded">
                        <p className="font-bold text-sm mb-1">📍 Pickup</p>
                        <p className="text-xs text-gray-700">
                          {route.pickupLocation ||
                            route.origin ||
                            "Start Point"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {originCoords[0].toFixed(4)},
                          {originCoords[1].toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Destination Marker */}
                {showOriginDestination && destCoords && (
                  <Marker position={destCoords} icon={destinationIcon}>
                    <Popup className="custom-popup">
                      <div className="p-2 bg-white rounded">
                        <p className="font-bold text-sm mb-1">🎯 Dropoff</p>
                        <p className="text-xs text-gray-700">
                          {route.dropoffLocation ||
                            route.destination ||
                            "End Point"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {destCoords[0].toFixed(4)},{destCoords[1].toFixed(4)}
                        </p>

                        {/* ✅ Display ETA on destination marker */}
                        {showETA && route.estimatedTimeMinutes && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className="font-semibold text-sm text-blue-600">
                              ⏱️ ETA: {formatETA(route.estimatedTimeMinutes)}
                            </p>
                            {route.alternative_routes && (
                              <div className="mt-1 text-xs">
                                <p className="font-semibold text-gray-700">
                                  Alternative routes:
                                </p>
                                {route.alternative_routes
                                  .slice(0, 2)
                                  .map((alt, idx) => (
                                    <p key={idx} className="text-gray-600">
                                      • {alt.name}: {formatETA(alt.eta_minutes)}
                                    </p>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}

        {/* ✅ Render vehicle markers */}
        {vehicles &&
          vehicles.map((vehicle) => {
            const lat = vehicle.latitude || 0;
            const lng = vehicle.longitude || 0;

            if (!lat || !lng) return null;

            return (
              <Marker
                key={vehicle.id || Math.random()}
                position={[lat, lng]}
                icon={vehicleIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-3 bg-white rounded">
                    <p className="font-bold text-lg mb-2">
                      🚗 {vehicle.name || "Vehicle"}
                    </p>
                    <p className="text-sm text-gray-700">
                      🔋 Battery:{" "}
                      {vehicle.batteryLevel
                        ? Math.round(vehicle.batteryLevel)
                        : "N/A"}
                      %
                    </p>
                    <p className="text-sm text-gray-700">
                      ⚡ Speed: {vehicle.speed ? Math.round(vehicle.speed) : 0}{" "}
                      km/h
                    </p>
                    <p className="text-sm text-gray-700">
                      📍 Status: {vehicle.status || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* ✅ Enhanced Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md rounded-xl p-4 z-10 text-sm shadow-xl border border-white/20">
        <p className="font-bold mb-3 text-white text-base">Legend</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
            <span className="text-white font-medium">Assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full shadow-lg"></div>
            <span className="text-white font-medium">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full shadow-lg"></div>
            <span className="text-white font-medium">Completed</span>
          </div>
        </div>

        {/* AI model info */}
        {showETA && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-cyan-300 font-semibold">
              ⏱️ ETA powered by AI/ML model
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
