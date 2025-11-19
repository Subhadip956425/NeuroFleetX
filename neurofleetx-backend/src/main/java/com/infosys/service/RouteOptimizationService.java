package com.infosys.service;

import com.infosys.dto.ETAPredictionRequest;
import com.infosys.dto.ETAPredictionResponse;
import com.infosys.model.AI.RouteStatus;
import com.infosys.model.Booking.Booking;
import com.infosys.model.DriverRoute;
import com.infosys.model.User;
import com.infosys.model.Vehicle;
import com.infosys.repository.BookingRepository;
import com.infosys.repository.DriverRouteRepository;
import com.infosys.repository.VehicleRepository;
import com.infosys.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class RouteOptimizationService {
    private static final Logger logger = LoggerFactory.getLogger(RouteOptimizationService.class);

    @Autowired
    private MLPredictionService mlPredictionService;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private DriverRouteRepository driverRouteRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get customer's routes from their bookings
     */
    public List<DriverRoute> getCustomerRoutes(Long customerId) {
        try {
            // Get all bookings for customer
            List<Booking> bookings = bookingRepository.findByCustomerId(customerId);
            logger.info("✅ Found {} bookings for customer {}", bookings.size(), customerId);

            List<DriverRoute> routes = new ArrayList<>();

            // For each booking, find associated routes
            for (Booking booking : bookings) {
                List<DriverRoute> bookingRoutes = driverRouteRepository.findByBooking(booking);
                routes.addAll(bookingRoutes);
            }

            logger.info("✅ Retrieved {} routes for customer {}", routes.size(), customerId);
            return routes;
        } catch (Exception e) {
            logger.error("❌ Error getting customer routes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Create optimized route from booking for driver
     */
    public DriverRoute createOptimizedRouteFromBooking(
            Long bookingId, Long driverId, Long vehicleId) {
        try {
            // Get booking details
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            // Get driver details
            User driver = userRepository.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));

            // Get vehicle details
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));

            // Create ETA prediction request
            ETAPredictionRequest request = new ETAPredictionRequest();
            request.setDistanceKm(booking.getDistance() != null ? booking.getDistance() : 50.0);
            request.setAvgSpeed(60.0);
            request.setTrafficLevel(0.5); // Default medium traffic
            request.setBatteryLevel(vehicle.getBatteryLevel() != null ? vehicle.getBatteryLevel() : 80.0);
            request.setFuelLevel(vehicle.getFuelLevel() != null ? vehicle.getFuelLevel() : 75.0);

            // Get ETA prediction
            ETAPredictionResponse etaResponse = mlPredictionService.predictETA(request);

            // ✅ Create DriverRoute using relationships (not IDs)
            DriverRoute driverRoute = DriverRoute.builder()
                    .booking(booking)      // ✅ Use Booking entity
                    .driver(driver)        // ✅ Use User entity
                    .vehicle(vehicle)      // ✅ Use Vehicle entity
                    .pickupLocation(booking.getPickupLocation())
                    .dropoffLocation(booking.getDropoffLocation())
                    .distanceKm(booking.getDistance() != null ? booking.getDistance() : 50.0)
                    .estimatedTimeMinutes(etaResponse.getPredicted_eta())
                    .trafficLevel(0.5)
                    .fastestEta(calculateETA(booking.getDistance(), 60.0, 0.2))
                    .balancedEta(calculateETA(booking.getDistance(), 60.0, 0.5))
                    .avoidTrafficEta(calculateETA(booking.getDistance(), 60.0, 0.8))
                    .status(RouteStatus.ASSIGNED)    // ✅ Use String, not enum
                    .batteryLevelAtStart(vehicle.getBatteryLevel())
                    .fuelLevelAtStart(vehicle.getFuelLevel())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            DriverRoute saved = driverRouteRepository.save(driverRoute);
            logger.info("✅ Optimized route created for booking {} - Driver {}", bookingId, driverId);

            return saved;
        } catch (Exception e) {
            logger.error("❌ Error creating optimized route: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create optimized route", e);
        }
    }

    /**
     * Calculate ETA based on distance, speed, and traffic
     */
    private Double calculateETA(Double distanceKm, Double avgSpeed, Double trafficLevel) {
        if (distanceKm == null || avgSpeed == null) return 90.0;

        double baseTime = (distanceKm / avgSpeed) * 60; // Convert to minutes
        double trafficMultiplier = 1.0 + (trafficLevel * 0.5); // 0.2 = 1.1x, 0.8 = 1.4x
        return baseTime * trafficMultiplier;
    }

    /**
     * Get driver's active routes
     */
    public List<DriverRoute> getDriverActiveRoutes(Long driverId) {
        try {
            User driver = userRepository.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));

            List<DriverRoute> routes = driverRouteRepository.findByDriverAndStatus(driver, "ASSIGNED");
            logger.info("✅ Retrieved {} active routes for driver {}", routes.size(), driverId);
            return routes;
        } catch (Exception e) {
            logger.error("❌ Error getting active routes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Get route details with alternatives
     */
    public Map<String, Object> getRouteDetails(Long driverRouteId) {
        DriverRoute route = driverRouteRepository.findById(driverRouteId)
                .orElseThrow(() -> new RuntimeException("Route not found"));

        Map<String, Object> details = new HashMap<>();
        details.put("id", route.getId());
        details.put("bookingId", route.getBookingId()); // ✅ Uses @Transient helper
        details.put("driverId", route.getDriverId());   // ✅ Uses @Transient helper
        details.put("vehicleId", route.getVehicleId()); // ✅ Uses @Transient helper
        details.put("pickupLocation", route.getPickupLocation());
        details.put("dropoffLocation", route.getDropoffLocation());
        details.put("distanceKm", route.getDistanceKm());

        // Alternative routes
        Map<String, Object> alternatives = new HashMap<>();
        alternatives.put("fastest", Map.of(
                "name", "Fastest",
                "eta_minutes", route.getFastestEta() != null ? route.getFastestEta() : 0.0,
                "traffic_level", 0.2,
                "description", "Light traffic - Quickest route"
        ));
        alternatives.put("balanced", Map.of(
                "name", "Balanced",
                "eta_minutes", route.getBalancedEta() != null ? route.getBalancedEta() : 0.0,
                "traffic_level", 0.5,
                "description", "Moderate traffic - Recommended"
        ));
        alternatives.put("avoidTraffic", Map.of(
                "name", "Avoid Traffic",
                "eta_minutes", route.getAvoidTrafficEta() != null ? route.getAvoidTrafficEta() : 0.0,
                "traffic_level", 0.8,
                "description", "Heavy traffic - Scenic route"
        ));

        details.put("alternatives", alternatives);
        details.put("status", route.getStatus());
        details.put("createdAt", route.getCreatedAt());

        return details;
    }

    /**
     * Start route (driver begins trip)
     */
    public DriverRoute startRoute(Long driverRouteId) {
        DriverRoute route = driverRouteRepository.findById(driverRouteId)
                .orElseThrow(() -> new RuntimeException("Route not found"));

        route.setStatus(RouteStatus.IN_PROGRESS); // ✅ Use String
        route.setStartedAt(LocalDateTime.now());
        route.setUpdatedAt(LocalDateTime.now());

        DriverRoute updated = driverRouteRepository.save(route);
        logger.info("✅ Route {} started at {}", driverRouteId, LocalDateTime.now());

        return updated;
    }

    /**
     * Complete route
     */
    public DriverRoute completeRoute(Long driverRouteId) {
        DriverRoute route = driverRouteRepository.findById(driverRouteId)
                .orElseThrow(() -> new RuntimeException("Route not found"));

        route.setStatus(RouteStatus.COMPLETED); // ✅ Use String
        route.setCompletedAt(LocalDateTime.now());
        route.setUpdatedAt(LocalDateTime.now());

        DriverRoute updated = driverRouteRepository.save(route);
        logger.info("✅ Route {} completed", driverRouteId);

        return updated;
    }
}
