import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map auto-fit component
function MapAutoFit({ vehicles }) {
  const map = useMap();

  useEffect(() => {
    if (vehicles.length > 0) {
      const validVehicles = vehicles.filter(
        (v) =>
          v.latitude &&
          v.longitude &&
          !isNaN(v.latitude) &&
          !isNaN(v.longitude) &&
          Math.abs(v.latitude) <= 90 &&
          Math.abs(v.longitude) <= 180
      );

      if (validVehicles.length > 0) {
        const bounds = L.latLngBounds(
          validVehicles.map((v) => [v.latitude, v.longitude])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [vehicles, map]);

  return null;
}

// Map tile configurations
const MAP_TILES = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

// Custom marker icon generator
const getMarkerIcon = (status) => {
  const iconColors = {
    Available: "#10b981",
    "In Use": "#f59e0b",
    "Needs Maintenance": "#ef4444",
    Offline: "#6b7280",
  };

  const color = iconColors[status] || "#3b82f6";

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          top: 6px;
          left: 10px;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function FleetMap({
  vehicles = [],
  height = "600px",
  showControls = true,
  showLegend = true,
  defaultStyle = "standard",
  className = "",
}) {
  const [mapStyle, setMapStyle] = useState(defaultStyle);
  const [mapView, setMapView] = useState("all");

  // Filter vehicles for map
  const mapVehicles = vehicles
    .filter((v) => {
      if (mapView === "available") return v.status === "Available";
      if (mapView === "inUse") return v.status === "In Use";
      return true;
    })
    .filter(
      (v) =>
        v.latitude &&
        v.longitude &&
        !isNaN(v.latitude) &&
        !isNaN(v.longitude) &&
        Math.abs(v.latitude) <= 90 &&
        Math.abs(v.longitude) <= 180
    );

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "Available").length,
    inUse: vehicles.filter((v) => v.status === "In Use").length,
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden ${className}`}
      >
        {/* Map Header */}
        {showControls && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🗺️
                  </motion.span>
                  <span>Live Fleet Map</span>
                </h2>
                <p className="text-white/60 mt-1 text-sm">
                  Real-time vehicle locations • {mapVehicles.length} vehicles
                  displayed
                </p>
              </div>

              <div className="flex gap-4 flex-wrap">
                {/* Map Style Selector */}
                <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapStyle("standard")}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                      mapStyle === "standard"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    🗺️ Standard
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapStyle("light")}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                      mapStyle === "light"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    ☀️ Light
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapStyle("dark")}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                      mapStyle === "dark"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    🌙 Dark
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapStyle("satellite")}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                      mapStyle === "satellite"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    🛰️ Satellite
                  </motion.button>
                </div>

                {/* Map Filter Buttons */}
                <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapView("all")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      mapView === "all"
                        ? "bg-white/20 text-white shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    All ({stats.total})
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapView("available")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      mapView === "available"
                        ? "bg-white/20 text-emerald-400 shadow-md"
                        : "text-white/60 hover:text-emerald-400"
                    }`}
                  >
                    Available ({stats.available})
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMapView("inUse")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      mapView === "inUse"
                        ? "bg-white/20 text-yellow-400 shadow-md"
                        : "text-white/60 hover:text-yellow-400"
                    }`}
                  >
                    In Use ({stats.inUse})
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="relative overflow-hidden"
          style={{ height }}
        >
          {mapVehicles.length > 0 ? (
            <MapContainer
              center={[20, 0]}
              zoom={2}
              className="h-full w-full z-0"
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <TileLayer
                url={MAP_TILES[mapStyle].url}
                attribution={MAP_TILES[mapStyle].attribution}
              />
              <MapAutoFit vehicles={mapVehicles} />
              {mapVehicles.map((v) => (
                <Marker
                  key={v.id}
                  position={[v.latitude, v.longitude]}
                  icon={getMarkerIcon(v.status)}
                >
                  <Popup className="custom-popup">
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">🚗</div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {v.name}
                          </h3>
                          <p className="text-sm text-gray-600">{v.type}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">
                            Status
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              v.status === "Available"
                                ? "text-green-600"
                                : v.status === "In Use"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-lg">🔋</span>
                              <span className="text-xs text-gray-600">
                                Battery
                              </span>
                            </div>
                            <p className="text-lg font-bold text-green-700">
                              {v.batteryLevel.toFixed(0)}%
                            </p>
                          </div>

                          <div className="p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-lg">⛽</span>
                              <span className="text-xs text-gray-600">
                                Fuel
                              </span>
                            </div>
                            <p className="text-lg font-bold text-blue-700">
                              {v.fuelLevel.toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {v.speed > 0 && (
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                💨 Speed
                              </span>
                              <span className="text-sm font-bold text-purple-700">
                                {v.speed.toFixed(1)} km/h
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-900/50">
              <div className="text-center">
                <div className="text-6xl mb-4">📍</div>
                <p className="text-white/60">No vehicles to display on map</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Map Legend */}
        {showLegend && (
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-white/70">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-white/70">In Use</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm text-white/70">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-white/70">Offline</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Global CSS for Leaflet */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .leaflet-popup-tip {
          background: white;
        }
        .leaflet-container {
          font-family: inherit;
          background: transparent !important;
        }
        .leaflet-control-zoom {
          border: 2px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: rgba(255, 255, 255, 0.9) !important;
          color: #333 !important;
          border: none !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 20px !important;
          font-weight: bold;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255, 255, 255, 1) !important;
        }
        .leaflet-tile-pane {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}
