package com.infosys.service;

import com.infosys.dto.MaintenancePredictionRequest;
import com.infosys.dto.MaintenancePredictionResponse;
import com.infosys.model.Vehicle;
import com.infosys.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class MaintenanceAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(MaintenanceAnalyticsService.class);

    @Autowired
    private MLPredictionService mlPredictionService;

    @Autowired
    private VehicleRepository vehicleRepository;

    /**
     * Check maintenance status for single vehicle
     */
    public MaintenancePredictionResponse checkVehicleMaintenance(Long vehicleId) {
        try {
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));

            MaintenancePredictionRequest request = new MaintenancePredictionRequest();
            request.setVehicleId(vehicleId);
            request.setMileage(vehicle.getMileage() != null ? vehicle.getMileage() : 0.0);
            request.setEngineTemp(vehicle.getEngineTemp() != null ? vehicle.getEngineTemp() : 90.0);
            request.setTirePressure(vehicle.getTirePressure() != null ? vehicle.getTirePressure() : 32.0);
            request.setBatteryHealth(vehicle.getBatteryLevel() != null ? vehicle.getBatteryLevel() : 85.0);
            request.setOilLevel(vehicle.getOilLevel() != null ? vehicle.getOilLevel() : 80.0);
            request.setBrakeWear(vehicle.getBrakeWear() != null ? vehicle.getBrakeWear() : 30.0);
            request.setDaysSinceLastMaintenance(vehicle.getDaysSinceLastMaintenance() != null ? vehicle.getDaysSinceLastMaintenance() : 45);

            MaintenancePredictionResponse prediction = mlPredictionService.predictMaintenance(request);
            
            logger.info("✅ Maintenance Check for Vehicle {}: Status = {}", vehicleId, prediction.getStatus());
            return prediction;

        } catch (Exception e) {
            logger.error("❌ Maintenance Check Error: {}", e.getMessage());
            throw new RuntimeException("Failed to check maintenance status", e);
        }
    }

    /**
     * Check fleet-wide maintenance status
     */
    public Map<String, Object> getFleetMaintenanceAnalytics() {
        try {
            List<Vehicle> vehicles = vehicleRepository.findAll();
            Map<String, Object> analytics = new HashMap<>();

            int healthyCount = 0;
            int dueCount = 0;
            int criticalCount = 0;
            List<Map<String, Object>> criticalVehicles = new ArrayList<>();

            for (Vehicle v : vehicles) {
                MaintenancePredictionResponse status = checkVehicleMaintenance(v.getId());
                
                switch (status.getStatus()) {
                    case "Healthy" -> healthyCount++;
                    case "Due" -> dueCount++;
                    case "Critical" -> {
                        criticalCount++;
                        Map<String, Object> criticalInfo = new HashMap<>();
                        criticalInfo.put("vehicleId", v.getId());
                        criticalInfo.put("vehicleName", v.getName());
                        criticalInfo.put("status", status.getStatus());
                        criticalInfo.put("daysUntilMaintenance", status.getDays_until_maintenance());
                        criticalVehicles.add(criticalInfo);
                    }
                }
            }

            analytics.put("total_vehicles", vehicles.size());
            analytics.put("healthy", healthyCount);
            analytics.put("due", dueCount);
            analytics.put("critical", criticalCount);
            analytics.put("critical_vehicles", criticalVehicles);

            logger.info("✅ Fleet Analytics: Healthy={}, Due={}, Critical={}", 
                healthyCount, dueCount, criticalCount);
            return analytics;

        } catch (Exception e) {
            logger.error("❌ Fleet Analytics Error: {}", e.getMessage());
            throw new RuntimeException("Failed to generate analytics", e);
        }
    }
}
