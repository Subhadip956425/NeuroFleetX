package com.infosys.service;

import com.infosys.dto.VehicleRecommendationRequest;
import com.infosys.dto.VehicleRecommendationResponse;
import com.infosys.model.Vehicle;
import com.infosys.repository.BookingRepository;
import com.infosys.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VehicleRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(VehicleRecommendationService.class);

    @Autowired
    private MLPredictionService mlPredictionService;

    @Autowired(required = false)
    private VehicleRepository vehicleRepository;

    @Autowired(required = false)
    private BookingRepository bookingRepository;

    /**
     * Get AI-recommended vehicles for customer booking
     * ✅ COMPLETE FIX: Proper null handling and logging
     */
    public List<VehicleRecommendationResponse> getRecommendations(VehicleRecommendationRequest request) {
        try {
            logger.info("========================================");
            logger.info("🤖 VEHICLE RECOMMENDATION SERVICE START");
            logger.info("   Vehicle Type: {}", request.getVehicleType());
            logger.info("========================================");

            // ============================================
            // Step 1: Call ML Service
            // ============================================
            logger.info("📞 Calling MLPredictionService.recommendVehicles()");

            List<VehicleRecommendationResponse> mlRecommendations =
                    mlPredictionService.recommendVehicles(request);

            logger.info("✅ ML Service returned {} recommendations",
                    mlRecommendations == null ? 0 : mlRecommendations.size());

            if (mlRecommendations == null || mlRecommendations.isEmpty()) {
                logger.warn("⚠️ ML service returned 0 recommendations");
                logger.info("📊 RETURNING: 0 vehicles");
                logger.info("========================================");
                return new ArrayList<>();
            }

            // ============================================
            // Step 2: Filter ONLY by Vehicle Type
            // ============================================
            String requestedType = request.getVehicleType();
            if (requestedType != null && !requestedType.isEmpty()) {
                logger.info("🔍 Filtering by vehicle type ONLY: {}", requestedType);

                List<VehicleRecommendationResponse> typeFiltered = mlRecommendations.stream()
                        .filter(rec -> {
                            String recType = rec.getType();
                            boolean matches = recType != null && recType.equalsIgnoreCase(requestedType);
                            if (!matches) {
                                logger.debug("❌ Vehicle {} type '{}' doesn't match '{}'",
                                        rec.getVehicle_id(), recType, requestedType);
                            }
                            return matches;
                        })
                        .collect(Collectors.toList());

                logger.info("✅ After type filtering: {} / {} vehicles match type '{}'",
                        typeFiltered.size(), mlRecommendations.size(), requestedType);

                mlRecommendations = typeFiltered;
            }

            // ============================================
            // Step 3: Check Availability (if times provided)
            // ============================================
            if (request.getStartTime() == null || request.getEndTime() == null) {
                logger.info("ℹ️ No times provided - SKIPPING availability filter");
                logger.info("📊 RETURNING: {} filtered recommendations", mlRecommendations.size());
                logger.info("========================================");
                return mlRecommendations;
            }

            logger.info("🔍 Availability filtering ENABLED");
            logger.info("   Start: {}", request.getStartTime());
            logger.info("   End: {}", request.getEndTime());

            if (vehicleRepository == null || bookingRepository == null) {
                logger.warn("⚠️ Repositories not available");
                logger.info("   Returning all {} recommendations (no DB filtering)", mlRecommendations.size());
                logger.info("========================================");
                return mlRecommendations;
            }

            try {
                DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
                LocalDateTime startTime = LocalDateTime.parse(request.getStartTime(), formatter);
                LocalDateTime endTime = LocalDateTime.parse(request.getEndTime(), formatter);

                logger.info("📅 Parsed: {} to {}", startTime, endTime);

                List<VehicleRecommendationResponse> availableRecommendations = new ArrayList<>();

                for (VehicleRecommendationResponse rec : mlRecommendations) {
                    Long vehicleId = rec.getVehicle_id();
                    logger.debug("🔎 Checking vehicle {}", vehicleId);

                    try {
                        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);

                        if (vehicle == null) {
                            logger.warn("⚠️ Vehicle {} NOT in DB - ADDING ANYWAY", vehicleId);
                            availableRecommendations.add(rec);
                            continue;
                        }

                        logger.debug("   Found in DB: {}", vehicle.getName());

                        var overlaps = bookingRepository.findOverlappingConfirmed(
                                vehicleId, startTime, endTime);

                        if (overlaps.isEmpty()) {
                            logger.info("✅ Vehicle {} AVAILABLE", vehicleId);
                            availableRecommendations.add(rec);
                        } else {
                            logger.info("❌ Vehicle {} HAS {} CONFLICTS", vehicleId, overlaps.size());
                        }

                    } catch (Exception e) {
                        logger.warn("⚠️ Error checking vehicle {}: {}", vehicleId, e.getMessage());
                        availableRecommendations.add(rec);
                    }
                }

                logger.info("📊 After availability filtering: {} available / {} total",
                        availableRecommendations.size(), mlRecommendations.size());
                logger.info("========================================");
                return availableRecommendations;

            } catch (Exception e) {
                logger.error("❌ Error parsing times: {}", e.getMessage());
                logger.info("🔄 Returning all {} recommendations (no filtering)", mlRecommendations.size());
                logger.info("========================================");
                return mlRecommendations;
            }

        } catch (Exception e) {
            logger.error("❌ FATAL ERROR: {}", e.getMessage(), e);
            logger.info("========================================");
            throw new RuntimeException("Failed to generate recommendations: " + e.getMessage(), e);
        }
    }


    /**
     * Get available vehicles with filters
     */
    public List<Map<String, Object>> getAvailableVehicles(
            String vehicleType,
            Boolean isEv,
            LocalDateTime startTime,
            LocalDateTime endTime) {

        if (vehicleRepository == null || bookingRepository == null) {
            logger.warn("⚠️ Repositories not available");
            return new ArrayList<>();
        }

        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Map<String, Object>> available = new ArrayList<>();

        for (Vehicle v : vehicles) {
            try {
                // Filter by type
                if (vehicleType != null && !vehicleType.isEmpty()) {
                    String vType = v.getType() != null ? v.getType().getName() : null;
                    if (vType == null || !vType.equalsIgnoreCase(vehicleType)) {
                        continue;
                    }
                }

                // Filter by EV
                if (isEv != null && isEv) {
                    if (v.getIsEv() == null || !v.getIsEv()) {
                        continue;
                    }
                }

                // Check availability if times provided
                if (startTime != null && endTime != null) {
                    var overlaps = bookingRepository.findOverlappingConfirmed(v.getId(), startTime, endTime);
                    if (!overlaps.isEmpty()) {
                        continue;
                    }
                }

                Map<String, Object> vInfo = new java.util.HashMap<>();
                vInfo.put("id", v.getId());
                vInfo.put("name", v.getName());
                vInfo.put("type", v.getType() != null ? v.getType().getName() : "Unknown");
                vInfo.put("isEv", v.getIsEv());
                vInfo.put("batteryLevel", v.getBatteryLevel());
                vInfo.put("fuelLevel", v.getFuelLevel());
                available.add(vInfo);

            } catch (Exception e) {
                logger.warn("⚠️ Error processing vehicle {}: {}", v.getId(), e.getMessage());
            }
        }

        logger.info("✅ {} Available Vehicles Found", available.size());
        return available;
    }
}
