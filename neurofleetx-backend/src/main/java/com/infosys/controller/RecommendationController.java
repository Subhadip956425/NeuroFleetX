package com.infosys.controller;

import com.infosys.dto.VehicleRecommendationRequest;
import com.infosys.dto.VehicleRecommendationResponse;
import com.infosys.service.VehicleRecommendationService;
import com.infosys.service.MaintenanceAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationController.class);

    @Autowired
    private VehicleRecommendationService vehicleRecommendationService;

    @Autowired
    private MaintenanceAnalyticsService maintenanceAnalyticsService;

    /**
     * Get AI-recommended vehicles for booking
     * ✅ FIXED: Returns proper error response
     */
    @PostMapping("/vehicles")
    public ResponseEntity<?> getVehicleRecommendations(
            @RequestBody VehicleRecommendationRequest request) {
        try {
            logger.info("📨 Received vehicle recommendation request");
            logger.debug("🔍 Request details: vehicleType={}, seats={}, isEv={}, distance={}",
                    request.getVehicleType(), request.getSeatsNeeded(),
                    request.getIsEvPreferred(), request.getDistanceKm());

            // ✅ Validate request
            if (request == null) {
                logger.error("❌ Request is null");
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Request body is required",
                        "message", "Failed to generate recommendations",
                        "status", "error"
                ));
            }

            // ✅ Call service
            List<VehicleRecommendationResponse> recommendations =
                    vehicleRecommendationService.getRecommendations(request);

            logger.info("✅ Generated {} recommendations", recommendations.size());

            // ✅ Return successful response with proper structure
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("data", recommendations);
                put("total", recommendations.size());
                put("status", "success");
            }});

        } catch (RuntimeException e) {
            logger.error("❌ RuntimeException in getVehicleRecommendations: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", "Failed to generate recommendations",
                    "message", e.getMessage(),
                    "status", "error"
            ));

        } catch (Exception e) {
            logger.error("❌ Unexpected exception in getVehicleRecommendations: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to generate recommendations",
                    "message", e.getMessage(),
                    "status", "error"
            ));
        }
    }

    /**
     * Get available vehicles with optional filters
     */
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableVehicles(
            @RequestParam(required = false) String vehicleType,
            @RequestParam(required = false) Boolean isEv,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        try {
            logger.info("🔍 Getting available vehicles");

            List<Map<String, Object>> available = vehicleRecommendationService.getAvailableVehicles(
                    vehicleType, isEv,
                    startTime != null ? LocalDateTime.parse(startTime) : null,
                    endTime != null ? LocalDateTime.parse(endTime) : null);

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("data", available);
                put("total", available.size());
                put("status", "success");
            }});

        } catch (Exception e) {
            logger.error("❌ Error getting available vehicles: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage(),
                    "status", "error"
            ));
        }
    }

    /**
     * Get fleet-wide maintenance analytics
     */
    @GetMapping("/maintenance/fleet-analytics")
    public ResponseEntity<?> getFleetMaintenanceAnalytics() {
        try {
            logger.info("📊 Getting fleet maintenance analytics");

            Map<String, Object> analytics = maintenanceAnalyticsService.getFleetMaintenanceAnalytics();

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("data", analytics);
                put("status", "success");
            }});

        } catch (Exception e) {
            logger.error("❌ Error getting fleet analytics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage(),
                    "status", "error"
            ));
        }
    }

    /**
     * Check maintenance for specific vehicle
     */
    @GetMapping("/maintenance/{vehicleId}")
    public ResponseEntity<?> checkVehicleMaintenance(@PathVariable Long vehicleId) {
        try {
            logger.info("🔧 Checking maintenance for vehicle: {}", vehicleId);

            var status = maintenanceAnalyticsService.checkVehicleMaintenance(vehicleId);

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("data", status);
                put("status", "success");
            }});

        } catch (Exception e) {
            logger.error("❌ Error checking vehicle maintenance: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage(),
                    "status", "error"
            ));
        }
    }
}
