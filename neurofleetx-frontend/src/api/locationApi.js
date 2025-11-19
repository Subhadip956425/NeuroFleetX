import axiosInstance from "./axiosInstance";

const locationApi = {
  // ✅ Geocode location name to coordinates using OpenStreetMap/Nominatim (free)
  geocodeLocation: async (locationName) => {
    try {
      console.log("🔍 Geocoding location:", locationName);

      // ✅ Using Nominatim (free OpenStreetMap geocoding)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationName
        )}&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name,
        };
        console.log("✅ Geocoded:", result);
        return result;
      } else {
        console.warn("⚠️ Location not found:", locationName);
        return null;
      }
    } catch (error) {
      console.error("❌ Error geocoding location:", error);
      return null;
    }
  },

  // ✅ Batch geocode multiple locations
  geocodeMultiple: async (locations) => {
    try {
      const results = {};
      for (const [key, location] of Object.entries(locations)) {
        if (location) {
          results[key] = await locationApi.geocodeLocation(location);
        }
      }
      return results;
    } catch (error) {
      console.error("❌ Error batch geocoding:", error);
      return {};
    }
  },

  // ✅ Get distance and duration between two points (using OSRM - OpenRouteService)
  getRouteInfo: async (originLat, originLng, destLat, destLng) => {
    try {
      console.log("🛣️ Fetching route info...");

      // ✅ Using OSRM (free routing service)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const result = {
          distanceKm: route.distance / 1000,
          durationMinutes: route.duration / 60,
          geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), // Convert to [lat, lng]
        };
        console.log("✅ Route info:", result);
        return result;
      } else {
        console.warn("⚠️ No route found");
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching route info:", error);
      return null;
    }
  },
};

export default locationApi;
