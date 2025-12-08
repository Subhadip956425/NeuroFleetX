package com.infosys.controller;

import com.infosys.model.Vehicle;
import com.infosys.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleLocationController {

    private static final Logger logger = LoggerFactory.getLogger(VehicleLocationController.class);
    private static final Random random = new Random();
    private static final String ML_SERVICE_URL = "https://neurofleetx-ml-latest.onrender.com";

    @Autowired
    private VehicleRepository vehicleRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    // ✅ FIX: Cache vehicle locations to prevent random jumps
    private static final ConcurrentHashMap<Long, VehicleLocationData> vehicleLocationCache = new ConcurrentHashMap<>();

    /**
     * Get vehicle's current GPS location
     * ✅ FIXED: Returns consistent location from database or cache
     */
    @GetMapping("/{vehicleId}/location")
    public Map<String, Object> getVehicleLiveLocation(@PathVariable Long vehicleId) {
        logger.info("📍 Getting live location for vehicle: {}", vehicleId);

        // ✅ Try to get from database first
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + vehicleId));

        // ✅ Use cached location if it exists and is recent (< 30 seconds old)
        VehicleLocationData cachedLocation = vehicleLocationCache.get(vehicleId);
        long currentTime = System.currentTimeMillis();

        if (cachedLocation != null && (currentTime - cachedLocation.timestamp) < 30000) {
            logger.info("✅ Using cached location for vehicle {}", vehicleId);
            return buildLocationResponse(cachedLocation);
        }

        // ✅ Initialize or update vehicle location
        VehicleLocationData locationData;

        if (cachedLocation == null) {
            // First time - use database coordinates or default
            double initialLat = vehicle.getLatitude() != null ? vehicle.getLatitude() : 22.5726;
            double initialLng = vehicle.getLongitude() != null ? vehicle.getLongitude() : 88.3639;

            locationData = new VehicleLocationData(
                    vehicleId,
                    initialLat,
                    initialLng,
                    vehicle.getSpeed() != null ? vehicle.getSpeed() : 50.0,
                    vehicle.getBatteryLevel() != null ? vehicle.getBatteryLevel() : 80.0,
                    vehicle.getFuelLevel() != null ? vehicle.getFuelLevel() : 75.0,
                    random.nextInt(360),
                    currentTime
            );

            logger.info("🆕 Initializing location for vehicle {} at [{}, {}]",
                    vehicleId, initialLat, initialLng);
        } else {
            // ✅ Simulate realistic movement (small incremental changes)
            // Move vehicle ~500m in a random direction
            double moveDistance = 0.005; // ~500m
            double angle = cachedLocation.heading + (random.nextDouble() - 0.5) * 30; // Vary heading ±15°

            double newLat = cachedLocation.latitude + (moveDistance * Math.cos(Math.toRadians(angle)));
            double newLng = cachedLocation.longitude + (moveDistance * Math.sin(Math.toRadians(angle)));

            // Update speed slightly
            double newSpeed = Math.max(20, Math.min(80, cachedLocation.speed + (random.nextDouble() - 0.5) * 10));

            locationData = new VehicleLocationData(
                    vehicleId,
                    newLat,
                    newLng,
                    newSpeed,
                    Math.max(10, cachedLocation.batteryLevel - 0.1), // Drain battery slowly
                    Math.max(10, cachedLocation.fuelLevel - 0.1), // Drain fuel slowly
                    (int) angle,
                    currentTime
            );

            logger.info("🚗 Vehicle {} moved to [{}, {}] at {} km/h",
                    vehicleId, newLat, newLng, newSpeed);
        }

        // ✅ Cache the location
        vehicleLocationCache.put(vehicleId, locationData);

        // ✅ Update database
        vehicle.setLatitude(locationData.latitude);
        vehicle.setLongitude(locationData.longitude);
        vehicle.setSpeed(locationData.speed);
        vehicle.setBatteryLevel(locationData.batteryLevel);
        vehicle.setFuelLevel(locationData.fuelLevel);
        vehicle.setLastUpdated(LocalDateTime.now());
        vehicleRepository.save(vehicle);

        return buildLocationResponse(locationData);
    }

    /**
     * ✅ Helper: Build consistent response format
     */
    private Map<String, Object> buildLocationResponse(VehicleLocationData data) {
        return Map.of(
                "vehicleId", data.vehicleId,
                "latitude", data.latitude,
                "longitude", data.longitude,
                "timestamp", data.timestamp,
                "speed", data.speed,
                "heading", data.heading,
                "batteryLevel", data.batteryLevel,
                "fuelLevel", data.fuelLevel
        );
    }

    /**
     * 🆕 Get AI-predicted ETA using vehicle's current location
     */
    @PostMapping("/{vehicleId}/predict-eta")
    public ResponseEntity<?> predictETAWithVehicleData(
            @PathVariable Long vehicleId,
            @RequestBody Map<String, Object> routeData) {

        try {
            logger.info("🤖 Predicting ETA for vehicle {} with AI", vehicleId);

            // Get CONSISTENT vehicle location
            Map<String, Object> vehicleLocation = getVehicleLiveLocation(vehicleId);

            double startLat = (double) routeData.get("startLat");
            double startLng = (double) routeData.get("startLng");
            double endLat = (double) routeData.get("endLat");
            double endLng = (double) routeData.get("endLng");

            double distanceKm = calculateDistance(startLat, startLng, endLat, endLng);

            Map<String, Object> mlRequest = new HashMap<>();
            mlRequest.put("distanceKm", distanceKm);
            mlRequest.put("avgSpeed", vehicleLocation.get("speed"));
            mlRequest.put("trafficLevel", routeData.getOrDefault("trafficLevel", 0.5));
            mlRequest.put("batteryLevel", vehicleLocation.get("batteryLevel"));
            mlRequest.put("fuelLevel", vehicleLocation.get("fuelLevel"));
            mlRequest.put("vehicleId", vehicleId);
            mlRequest.put("currentLat", vehicleLocation.get("latitude"));
            mlRequest.put("currentLng", vehicleLocation.get("longitude"));

            logger.info("📊 ML Request: distance={}km, speed={}km/h", distanceKm, vehicleLocation.get("speed"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(mlRequest, headers);

            ResponseEntity<Map> mlResponse = restTemplate.postForEntity(
                    ML_SERVICE_URL + "/api/live-tracking/predict-eta",
                    entity,
                    Map.class
            );

            Map<String, Object> response = new HashMap<>();
            response.put("vehicleLocation", vehicleLocation);
            response.put("aiPrediction", mlResponse.getBody());
            response.put("distanceKm", distanceKm);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Error predicting ETA: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to predict ETA",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 🆕 Get optimized route with AI predictions
     */
    @GetMapping("/{vehicleId}/optimized-route")
    public ResponseEntity<?> getOptimizedRoute(
            @PathVariable Long vehicleId,
            @RequestParam double pickupLat,
            @RequestParam double pickupLng,
            @RequestParam double dropoffLat,
            @RequestParam double dropoffLng) {

        try {
            logger.info("🗺️ Getting optimized route for vehicle {}", vehicleId);

            // Get CONSISTENT vehicle location
            Map<String, Object> vehicleLocation = getVehicleLiveLocation(vehicleId);
            double vehicleLat = (double) vehicleLocation.get("latitude");
            double vehicleLng = (double) vehicleLocation.get("longitude");

            logger.info("🚗 Vehicle {} current position: [{}, {}]", vehicleId, vehicleLat, vehicleLng);

            double distanceToPickup = calculateDistance(vehicleLat, vehicleLng, pickupLat, pickupLng);
            double distancePickupToDropoff = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);

            // Prepare ML requests
            Map<String, Object> segment1Request = Map.of(
                    "distanceKm", distanceToPickup,
                    "avgSpeed", vehicleLocation.get("speed"),
                    "trafficLevel", 0.5,
                    "batteryLevel", vehicleLocation.get("batteryLevel"),
                    "fuelLevel", vehicleLocation.get("fuelLevel")
            );

            Map<String, Object> segment2Request = Map.of(
                    "distanceKm", distancePickupToDropoff,
                    "avgSpeed", 50,
                    "trafficLevel", 0.5,
                    "batteryLevel", vehicleLocation.get("batteryLevel"),
                    "fuelLevel", vehicleLocation.get("fuelLevel")
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<Map> eta1Response = restTemplate.postForEntity(
                    ML_SERVICE_URL + "/api/live-tracking/predict-eta",
                    new HttpEntity<>(segment1Request, headers),
                    Map.class
            );

            ResponseEntity<Map> eta2Response = restTemplate.postForEntity(
                    ML_SERVICE_URL + "/api/live-tracking/predict-eta",
                    new HttpEntity<>(segment2Request, headers),
                    Map.class
            );

            Map<String, Object> response = new HashMap<>();
            response.put("vehicleLocation", vehicleLocation);
            response.put("segment1", Map.of(
                    "from", "Vehicle",
                    "to", "Pickup",
                    "distance", distanceToPickup,
                    "aiPrediction", eta1Response.getBody()
            ));
            response.put("segment2", Map.of(
                    "from", "Pickup",
                    "to", "Dropoff",
                    "distance", distancePickupToDropoff,
                    "aiPrediction", eta2Response.getBody()
            ));

            logger.info("✅ Optimized route: Segment1={}km, Segment2={}km",
                    distanceToPickup, distancePickupToDropoff);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Error calculating optimized route: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to calculate optimized route",
                    "message", e.getMessage()
            ));
        }
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * ✅ Inner class to cache vehicle location data
     */
    private static class VehicleLocationData {
        long vehicleId;
        double latitude;
        double longitude;
        double speed;
        double batteryLevel;
        double fuelLevel;
        int heading;
        long timestamp;

        VehicleLocationData(long vehicleId, double latitude, double longitude,
                            double speed, double batteryLevel, double fuelLevel,
                            int heading, long timestamp) {
            this.vehicleId = vehicleId;
            this.latitude = latitude;
            this.longitude = longitude;
            this.speed = speed;
            this.batteryLevel = batteryLevel;
            this.fuelLevel = fuelLevel;
            this.heading = heading;
            this.timestamp = timestamp;
        }
    }
}
