import React from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icons
const vehicleIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const originIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  className: "origin-marker", // You can style this differently
});

const destinationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  className: "destination-marker",
});

export default function RouteMap({
  routes = [],
  vehicles = [],
  height = "500px",
  showOriginDestination = true, // NEW: Control origin/destination markers
}) {
  const center = vehicles[0]
    ? [vehicles[0].latitude, vehicles[0].longitude]
    : [28.6139, 77.209];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height, width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Render route polylines */}
        {routes.map((r) => {
          // Parse geometry
          const path =
            r.geometry && r.geometry.length
              ? r.geometry
              : r.origin &&
                r.destination &&
                r.origin.includes(",") &&
                r.destination.includes(",")
              ? [
                  r.origin.split(",").map(Number),
                  r.destination.split(",").map(Number),
                ]
              : r.originLat &&
                r.originLng &&
                r.destinationLat &&
                r.destinationLng
              ? [
                  [r.originLat, r.originLng],
                  [r.destinationLat, r.destinationLng],
                ]
              : [];

          // Status-based color
          const color =
            r.status === "ASSIGNED"
              ? "#10b981"
              : r.status === "IN_PROGRESS"
              ? "#f59e0b"
              : r.status === "COMPLETED"
              ? "#6b7280"
              : "#3b82f6";

          // Extract origin and destination coordinates
          const originCoords = path[0];
          const destCoords = path[path.length - 1];

          return (
            <React.Fragment key={r.id}>
              {/* Polyline */}
              {path && path.length > 1 && (
                <Polyline
                  positions={path}
                  color={color}
                  weight={4}
                  opacity={0.8}
                />
              )}

              {/* Origin Marker */}
              {showOriginDestination && originCoords && (
                <Marker position={originCoords} icon={originIcon}>
                  <Popup className="custom-popup">
                    <div className="p-2">
                      <p className="font-bold text-sm mb-1">🚀 Origin</p>
                      <p className="text-xs">{r.origin || "Start Point"}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination Marker */}
              {showOriginDestination && destCoords && (
                <Marker position={destCoords} icon={destinationIcon}>
                  <Popup className="custom-popup">
                    <div className="p-2">
                      <p className="font-bold text-sm mb-1">🎯 Destination</p>
                      <p className="text-xs">{r.destination || "End Point"}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}

        {/* Render vehicle markers */}
        {vehicles.map((v) => (
          <Marker
            key={v.id}
            position={[v.latitude, v.longitude]}
            icon={vehicleIcon}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <p className="font-bold text-lg mb-2">{v.name}</p>
                <p className="text-sm">
                  🔋 Battery: {Math.round(v.batteryLevel || 0)}%
                </p>
                <p className="text-sm">
                  ⚡ Speed: {Math.round(v.speed || 0)} km/h
                </p>
                <p className="text-sm">📍 Status: {v.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
