package com.infosys.controller;

import com.infosys.model.DriverRoute;
import com.infosys.service.RouteOptimizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RouteOptimizationController {
    private static final Logger logger = LoggerFactory.getLogger(RouteOptimizationController.class);

    @Autowired
    private RouteOptimizationService routeOptimizationService;

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<?> getCustomerRoutes(@PathVariable Long customerId) {
        try {
            List<DriverRoute> routes = routeOptimizationService.getCustomerRoutes(customerId);
            logger.info("✅ Retrieved {} routes for customer {}", routes.size(), customerId);
            return ResponseEntity.ok(routes);
        } catch (Exception e) {
            logger.error("❌ Error fetching customer routes: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create optimized route from booking
     */
    @PostMapping("/from-booking/{bookingId}")
    public ResponseEntity<?> createRouteFromBooking(
            @PathVariable Long bookingId,
            @RequestParam Long driverId,
            @RequestParam Long vehicleId) {
        try {
            DriverRoute route = routeOptimizationService.createOptimizedRouteFromBooking(
                    bookingId, driverId, vehicleId);
            return ResponseEntity.ok(route);
        } catch (Exception e) {
            logger.error("❌ Error creating route: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get driver's active routes
     */
    @GetMapping("/driver/{driverId}/active")
    public ResponseEntity<?> getDriverActiveRoutes(@PathVariable Long driverId) {
        try {
            List<DriverRoute> routes = routeOptimizationService.getDriverActiveRoutes(driverId);
            return ResponseEntity.ok(routes);
        } catch (Exception e) {
            logger.error("❌ Error fetching routes: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get route details with alternatives
     */
    @GetMapping("/{routeId}/details")
    public ResponseEntity<?> getRouteDetails(@PathVariable Long routeId) {
        try {
            Map details = routeOptimizationService.getRouteDetails(routeId);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            logger.error("❌ Error fetching route details: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Start route
     */
    @PutMapping("/{routeId}/start")
    public ResponseEntity<?> startRoute(@PathVariable Long routeId) {
        try {
            DriverRoute route = routeOptimizationService.startRoute(routeId);
            return ResponseEntity.ok(route);
        } catch (Exception e) {
            logger.error("❌ Error starting route: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Complete route
     */
    @PutMapping("/{routeId}/complete")
    public ResponseEntity<?> completeRoute(@PathVariable Long routeId) {
        try {
            DriverRoute route = routeOptimizationService.completeRoute(routeId);
            return ResponseEntity.ok(route);
        } catch (Exception e) {
            logger.error("❌ Error completing route: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
