import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
} from "react-leaflet";
import { motion } from "framer-motion";
import analyticsApi from "../../api/analyticsApi";
import "leaflet/dist/leaflet.css";

const FleetHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]); // Default: Delhi
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadHeatmapData();
    loadFleetData();
    const interval = setInterval(() => {
      loadHeatmapData();
      loadFleetData();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [dateRange]);

  // In loadHeatmapData, add zoom calculation:
  const loadHeatmapData = async () => {
    try {
      const res = await analyticsApi.getTripHeatmap(
        dateRange.startDate,
        dateRange.endDate
      );
      setHeatmapData(res.data || []);

      if (res.data?.length > 0) {
        const validLocations = res.data.filter((loc) => loc.lat && loc.lng);

        if (validLocations.length > 0) {
          // Calculate center
          const avgLat =
            validLocations.reduce((sum, loc) => sum + loc.lat, 0) /
            validLocations.length;
          const avgLng =
            validLocations.reduce((sum, loc) => sum + loc.lng, 0) /
            validLocations.length;
          setMapCenter([avgLat, avgLng]);

          // ✅ Calculate zoom based on data spread
          const lats = validLocations.map((loc) => loc.lat);
          const lngs = validLocations.map((loc) => loc.lng);
          const latSpread = Math.max(...lats) - Math.min(...lats);
          const lngSpread = Math.max(...lngs) - Math.min(...lngs);
          const maxSpread = Math.max(latSpread, lngSpread);

          // Dynamic zoom: closer spread = higher zoom
          let calculatedZoom = 12; // default
          if (maxSpread < 0.05) calculatedZoom = 14; // Very tight cluster
          else if (maxSpread < 0.1) calculatedZoom = 13; // Close cluster
          else if (maxSpread < 0.2) calculatedZoom = 12; // Medium spread
          else if (maxSpread < 0.5) calculatedZoom = 11; // Wide spread
          else calculatedZoom = 10; // Very wide spread

          setMapZoom(calculatedZoom);
          console.log(
            `🔍 Auto-zoom set to: ${calculatedZoom} (spread: ${maxSpread.toFixed(
              4
            )})`
          );
        }
      }
    } catch (err) {
      console.error("❌ Error loading heatmap data:", err);
      setHeatmapData([]);
    }
  };

  const loadFleetData = async () => {
    try {
      const res = await analyticsApi.getFleetDistribution();
      setFleetData(res.data);
    } catch (err) {
      console.error("Error loading fleet data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Color intensity based on trip density (number of trips at location)
  const getDensityColor = (tripCount) => {
    if (tripCount >= 20) return "#dc2626"; // Very High - Red
    if (tripCount >= 15) return "#ea580c"; // High - Orange
    if (tripCount >= 10) return "#f59e0b"; // Medium-High - Amber
    if (tripCount >= 5) return "#eab308"; // Medium - Yellow
    if (tripCount >= 2) return "#84cc16"; // Low-Medium - Lime
    return "#10b981"; // Low - Green
  };

  // Radius based on density
  const getDensityRadius = (tripCount) => {
    return Math.min(20 + tripCount * 2, 50); // Scale radius with trip count
  };

  // Opacity based on density
  const getDensityOpacity = (tripCount) => {
    return Math.min(0.3 + tripCount * 0.03, 0.9);
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
          <div className="text-white text-xl">
            Loading trip density heatmap...
          </div>
        </div>
      </div>
    );
  }

  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          No Trip Density Data Available
        </h3>
        <p className="text-white/60">
          Trip heatmap data will appear here once bookings are created
        </p>
        <p className="text-white/40 text-sm mt-2">
          Selected range: {dateRange.startDate} to {dateRange.endDate}
        </p>
      </div>
    );
  }

  // Calculate total trips
  const totalTrips = heatmapData.reduce(
    (sum, location) => sum + (location.tripCount || 0),
    0
  );

  // Get top 5 hotspots
  const topHotspots = [...heatmapData]
    .sort((a, b) => (b.tripCount || 0) - (a.tripCount || 0))
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            Trip Density Heatmap
          </h3>
          <p className="text-white/60 text-sm mt-1">
            {totalTrips} total trips • {heatmapData.length} locations • Last
            updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            loadHeatmapData();
            loadFleetData();
          }}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg"
        >
          🔄 Refresh
        </motion.button>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-4 flex-wrap bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex-1 min-w-[200px]">
          <label className="text-white/80 text-sm font-medium mb-2 block">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-white/80 text-sm font-medium mb-2 block">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Density Legend */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h4 className="text-white font-bold mb-3">Trip Density Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Very High (20+)", color: "#dc2626", count: "20+" },
            { label: "High (15-19)", color: "#ea580c", count: "15-19" },
            { label: "Medium-High (10-14)", color: "#f59e0b", count: "10-14" },
            { label: "Medium (5-9)", color: "#eab308", count: "5-9" },
            { label: "Low-Medium (2-4)", color: "#84cc16", count: "2-4" },
            { label: "Low (1)", color: "#10b981", count: "1" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <span className="text-white/80 text-xs font-medium block">
                  {item.count} trips
                </span>
                <span className="text-white/50 text-[10px]">
                  {item.label.split(" (")[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="h-[700px] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom} // ✅ Dynamic zoom
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Trip Density Circles */}
          {heatmapData.map((location, index) => (
            <CircleMarker
              key={`heatmap-${index}`}
              center={[location.lat, location.lng]}
              radius={getDensityRadius(location.tripCount)}
              fillColor={getDensityColor(location.tripCount)}
              color={getDensityColor(location.tripCount)}
              weight={2}
              fillOpacity={getDensityOpacity(location.tripCount)}
            >
              <Popup>
                <div className="text-sm">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    {location.locationName || "Trip Location"}
                  </h4>
                  <div className="space-y-1">
                    <p className="text-gray-700 font-semibold">
                      <span className="text-2xl">{location.tripCount}</span>{" "}
                      trips
                    </p>
                    <p className="text-gray-600 text-xs">
                      Location: {location.lat.toFixed(4)},{" "}
                      {location.lng.toFixed(4)}
                    </p>
                    {location.pickupCount > 0 && (
                      <p className="text-green-700 text-xs">
                        ↗️ Pickups: {location.pickupCount}
                      </p>
                    )}
                    {location.dropoffCount > 0 && (
                      <p className="text-blue-700 text-xs">
                        ↙️ Dropoffs: {location.dropoffCount}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Real-time Fleet Positions (Optional overlay) */}
          {fleetData?.vehicles
            ?.filter((v) => v.lat && v.lng)
            .map((vehicle) => (
              <CircleMarker
                key={`vehicle-${vehicle.id}`}
                center={[vehicle.lat, vehicle.lng]}
                radius={6}
                fillColor="#3b82f6"
                color="#ffffff"
                weight={2}
                fillOpacity={1}
              >
                <Popup>
                  <div className="text-sm">
                    <h4 className="font-bold text-gray-900">
                      🚗 {vehicle.name}
                    </h4>
                    <p className="text-gray-600">Status: {vehicle.status}</p>
                    <p className="text-gray-500 text-xs">Real-time position</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>

      {/* Top 5 Hotspots */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
          <span className="text-xl">🔥</span>
          Top 5 Trip Hotspots
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {topHotspots.map((hotspot, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-black text-white">
                  #{index + 1}
                </span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: getDensityColor(hotspot.tripCount),
                  }}
                />
              </div>
              <p className="text-xl font-black text-white">
                {hotspot.tripCount}
              </p>
              <p className="text-white/60 text-xs">trips</p>
              <p className="text-white/40 text-[10px] mt-1 truncate">
                {hotspot.locationName ||
                  `${hotspot.lat.toFixed(2)}, ${hotspot.lng.toFixed(2)}`}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-sm bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4">
          <p className="text-cyan-400 text-sm font-medium">Total Trips</p>
          <p className="text-3xl font-black text-white mt-1">{totalTrips}</p>
        </div>
        <div className="backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
          <p className="text-purple-400 text-sm font-medium">
            Unique Locations
          </p>
          <p className="text-3xl font-black text-white mt-1">
            {heatmapData.length}
          </p>
        </div>
        <div className="backdrop-blur-sm bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
          <p className="text-green-400 text-sm font-medium">
            Avg Trips/Location
          </p>
          <p className="text-3xl font-black text-white mt-1">
            {(totalTrips / heatmapData.length).toFixed(1)}
          </p>
        </div>
        <div className="backdrop-blur-sm bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-xl p-4">
          <p className="text-orange-400 text-sm font-medium">Peak Hotspot</p>
          <p className="text-3xl font-black text-white mt-1">
            {topHotspots[0]?.tripCount || 0}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default FleetHeatmap;
