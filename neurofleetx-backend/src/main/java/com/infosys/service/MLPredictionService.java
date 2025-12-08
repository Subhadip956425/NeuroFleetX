package com.infosys.service;

import com.infosys.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MLPredictionService {

    private static final Logger logger = LoggerFactory.getLogger(MLPredictionService.class);

    @Autowired(required = false)
    private RestTemplate mlServiceRestTemplate;

    @Value("${ml.service.url:https://neurofleetx-ml-latest.onrender.com/api}")
    private String mlServiceUrl;

    /**
     * Predict ETA using ML model
     */
    /**
     * Predict ETA using ML model
     */
    public ETAPredictionResponse predictETA(ETAPredictionRequest request) {
        try {
            if (!isMLServiceHealthy()) {
                logger.warn("⚠️ ML Service not healthy, returning default ETA");
                return getDefaultETAResponse();
            }

            String url = mlServiceUrl + "/routes/predict-eta";
            logger.info("📨 Calling ETA prediction: POST {}", url);
            logger.debug("📤 Request data: {}", request);

            if (mlServiceRestTemplate == null) {
                logger.error("❌ RestTemplate not configured");
                return getDefaultETAResponse();
            }

            // ✅ Call Flask endpoint
            @SuppressWarnings("unchecked")
            Map<String, Object> response = mlServiceRestTemplate.postForObject(
                    url,
                    request,
                    Map.class
            );

            if (response == null) {
                logger.error("❌ Null response from ML service");
                return getDefaultETAResponse();
            }

            logger.debug("✅ Response from ML service: {}", response);

            // ✅ Handle nested "data" wrapper from Flask
            @SuppressWarnings("unchecked")
            Map<String, Object> data = response.containsKey("data")
                    ? (Map<String, Object>) response.get("data")
                    : response;

            ETAPredictionResponse etaResponse = new ETAPredictionResponse();

            // ✅ Parse predicted ETA
            Object etaValue = data.get("predicted_eta");
            if (etaValue instanceof Number) {
                Double eta = ((Number) etaValue).doubleValue();
                etaResponse.setPredicted_eta(eta);
                logger.info("✅ ETA Predicted: {} minutes", eta);
            } else {
                logger.warn("⚠️ Invalid ETA value type: {}", etaValue == null ? "null" : etaValue.getClass());
                return getDefaultETAResponse();
            }

            // ✅ Parse alternative routes using helper method
            if (data.containsKey("alternative_routes")) {
                try {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> routes = (List<Map<String, Object>>) data.get("alternative_routes");
                    etaResponse.setAlternativeRoutesFromMap(routes);
                    logger.info("✅ Parsed {} alternative routes",
                            etaResponse.getAlternative_routes() != null ? etaResponse.getAlternative_routes().size() : 0);
                } catch (Exception e) {
                    logger.warn("⚠️ Error parsing alternative routes: {}", e.getMessage());
                }
            }

            etaResponse.setStatus("success");
            etaResponse.setMessage("ETA prediction successful");
            return etaResponse;

        } catch (RestClientException e) {
            logger.error("❌ ML Service connection error (ETA): {}", e.getMessage());
            logger.error("🔍 URL attempted: {}{}", mlServiceUrl, "/routes/predict-eta");
            return getDefaultETAResponse();

        } catch (Exception e) {
            logger.error("❌ Unexpected error in ETA prediction: {}", e.getMessage(), e);
            return getDefaultETAResponse();
        }
    }

    private ETAPredictionResponse getDefaultETAResponse() {
        ETAPredictionResponse response = new ETAPredictionResponse();
        response.setPredicted_eta(90.0); // 90 minutes default
        response.setStatus("error");
        response.setMessage("Using default ETA due to service unavailability");
        logger.info("⚠️ Returning default ETA response: {} minutes", 90.0);
        return response;
    }


    /**
     * Get vehicle recommendations using ML model
     */
    public List<VehicleRecommendationResponse> recommendVehicles(
            VehicleRecommendationRequest request) {
        try {
            if (!isMLServiceHealthy()) {
                logger.warn("⚠️ ML Service not healthy, returning empty recommendations");
                return new ArrayList<>();
            }

            String url = mlServiceUrl + "/recommendations/vehicles";
            logger.info("📨 Calling vehicle recommendation: POST {}", url);
            logger.debug("📤 Request data: {}", request);

            if (mlServiceRestTemplate == null) {
                logger.error("❌ RestTemplate not configured");
                return new ArrayList<>();
            }

            Map<String, Object> response = mlServiceRestTemplate.postForObject(
                    url,
                    request,
                    Map.class
            );

            if (response == null) {
                logger.warn("⚠️ Null response from ML service");
                return new ArrayList<>();
            }

            logger.debug("✅ Response from ML service: {}", response);

            // Handle nested "data" wrapper
            List<Map<String, Object>> recommendations = response.containsKey("data")
                    ? (List<Map<String, Object>>) response.get("data")
                    : (List<Map<String, Object>>) response.get("recommendations");

            if (recommendations == null || recommendations.isEmpty()) {
                logger.info("⚠️ No recommendations in response");
                return new ArrayList<>();
            }

            List<VehicleRecommendationResponse> result = new ArrayList<>();

            for (Map<String, Object> rec : recommendations) {
                try {
                    VehicleRecommendationResponse vrr = new VehicleRecommendationResponse();

                    if (rec.get("vehicle_id") instanceof Number) {
                        vrr.setVehicle_id(((Number) rec.get("vehicle_id")).longValue());
                    }

                    if (rec.get("confidence_score") instanceof Number) {
                        vrr.setConfidence_score(((Number) rec.get("confidence_score")).doubleValue());
                    }

                    if (rec.get("is_ai_recommended") instanceof Boolean) {
                        vrr.setIs_ai_recommended((Boolean) rec.get("is_ai_recommended"));
                    }

                    result.add(vrr);

                } catch (Exception e) {
                    logger.warn("⚠️ Error parsing recommendation: {}", e.getMessage());
                }
            }

            logger.info("✅ Generated {} recommendations", result.size());
            return result;

        } catch (RestClientException e) {
            logger.error("❌ ML Service connection error (Recommendations): {}", e.getMessage());
            logger.error("🔍 URL attempted: {}{}", mlServiceUrl, "/recommendations/vehicles");
            return new ArrayList<>();

        } catch (Exception e) {
            logger.error("❌ Unexpected error in vehicle recommendation: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Predict vehicle maintenance status
     */
    /**
     * Predict vehicle maintenance status
     */
    public MaintenancePredictionResponse predictMaintenance(MaintenancePredictionRequest request) {
        try {
            if (request == null || request.getVehicleId() == null) {
                logger.error("❌ Invalid maintenance prediction request");
                return getDefaultMaintenanceResponse();
            }

            if (!isMLServiceHealthy()) {
                logger.warn("⚠️ ML Service not healthy for maintenance prediction");
                return getDefaultMaintenanceResponse();
            }

            Long vehicleId = request.getVehicleId();
            String url = mlServiceUrl + "/recommendations/maintenance/" + vehicleId;
            logger.info("📨 Calling maintenance prediction: GET {}", url);
            logger.debug("📤 Vehicle ID: {}, Mileage: {}, Engine Temp: {}",
                    vehicleId, request.getMileage(), request.getEngineTemp());

            if (mlServiceRestTemplate == null) {
                logger.error("❌ RestTemplate not configured");
                return getDefaultMaintenanceResponse();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> response = mlServiceRestTemplate.getForObject(
                    url,
                    Map.class
            );

            if (response == null) {
                logger.warn("⚠️ Null response from ML service");
                return getDefaultMaintenanceResponse();
            }

            logger.debug("✅ Response from ML service: {}", response);

            // ✅ Handle nested "data" wrapper from Flask
            @SuppressWarnings("unchecked")
            Map<String, Object> data = response.containsKey("data")
                    ? (Map<String, Object>) response.get("data")
                    : response;

            MaintenancePredictionResponse mainResponse = new MaintenancePredictionResponse();

            try {
                mainResponse.setStatus((String) data.get("status"));
                mainResponse.setStatus_code(((Number) data.get("status_code")).intValue());
                mainResponse.setHealth_score(((Number) data.get("health_score")).doubleValue());
                mainResponse.setDays_until_maintenance(((Number) data.get("days_until_maintenance")).intValue());
                mainResponse.setNext_maintenance_date((String) data.get("next_maintenance_date"));
                mainResponse.setConfidence(((Number) data.get("confidence")).doubleValue());
                mainResponse.setMessage("Maintenance prediction successful");

                logger.info("✅ Maintenance Status for vehicle {}: {} (Score: {})",
                        vehicleId, mainResponse.getStatus(), mainResponse.getHealth_score());

                return mainResponse;

            } catch (Exception e) {
                logger.warn("⚠️ Error parsing maintenance response: {}", e.getMessage());
                return getDefaultMaintenanceResponse();
            }

        } catch (RestClientException e) {
            logger.error("❌ ML Service connection error (Maintenance): {}", e.getMessage());
            logger.error("🔍 URL attempted: {}{}{}", mlServiceUrl, "/recommendations/maintenance/",
                    request != null ? request.getVehicleId() : "null");
            return getDefaultMaintenanceResponse();

        } catch (Exception e) {
            logger.error("❌ Unexpected error in maintenance prediction: {}", e.getMessage(), e);
            return getDefaultMaintenanceResponse();
        }
    }

    private MaintenancePredictionResponse getDefaultMaintenanceResponse() {
        MaintenancePredictionResponse response = new MaintenancePredictionResponse();
        response.setStatus("HEALTHY");
        response.setStatus_code(0);
        response.setHealth_score(80.0);
        response.setDays_until_maintenance(60);
        response.setConfidence(50.0);
        response.setMessage("Using default maintenance response due to service unavailability");
        logger.info("⚠️ Returning default maintenance response");
        return response;
    }

    /**
     * Get fleet maintenance analytics
     */
    public Map<String, Object> getFleetMaintenanceAnalytics() {
        try {
            if (!isMLServiceHealthy()) {
                return Map.of("error", "ML Service not available");
            }

            String url = mlServiceUrl + "/recommendations/maintenance/fleet-analytics";
            logger.info("📨 Fetching fleet analytics: GET {}", url);

            if (mlServiceRestTemplate == null) {
                logger.error("❌ RestTemplate not configured");
                return new HashMap<>();
            }

            Map<String, Object> response = mlServiceRestTemplate.getForObject(
                    url,
                    Map.class
            );

            if (response == null) {
                logger.warn("⚠️ No fleet analytics response");
                return new HashMap<>();
            }

            Map<String, Object> data = response.containsKey("data")
                    ? (Map<String, Object>) response.get("data")
                    : response;

            logger.info("✅ Fleet analytics retrieved");
            return data;

        } catch (Exception e) {
            logger.error("❌ Error fetching fleet analytics: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Get critical vehicles for maintenance
     */
    public List<Map<String, Object>> getCriticalVehicles() {
        try {
            if (!isMLServiceHealthy()) {
                return new ArrayList<>();
            }

            String url = mlServiceUrl + "/recommendations/maintenance/critical-vehicles";
            logger.info("📨 Fetching critical vehicles: GET {}", url);

            if (mlServiceRestTemplate == null) {
                logger.error("❌ RestTemplate not configured");
                return new ArrayList<>();
            }

            Map<String, Object> response = mlServiceRestTemplate.getForObject(
                    url,
                    Map.class
            );

            if (response == null) {
                return new ArrayList<>();
            }

            List<Map<String, Object>> data = response.containsKey("data")
                    ? (List<Map<String, Object>>) response.get("data")
                    : new ArrayList<>();

            logger.info("✅ Retrieved {} critical vehicles", data.size());
            return data;

        } catch (Exception e) {
            logger.error("❌ Error fetching critical vehicles: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Health check for ML service
     */
    public boolean isMLServiceHealthy() {
        try {
            String url = mlServiceUrl + "/health";
            logger.debug("🔍 Checking ML service health: GET {}", url);

            if (mlServiceRestTemplate == null) {
                logger.warn("⚠️ RestTemplate not configured");
                return false;
            }

            Map<String, Object> response = mlServiceRestTemplate.getForObject(url, Map.class);

            if (response == null) {
                logger.warn("⚠️ ML Service returned null health check");
                return false;
            }

            boolean isHealthy = "healthy".equals(response.get("status"));
            logger.info("✅ ML Service Health: {}", isHealthy ? "HEALTHY ✅" : "UNHEALTHY ❌");

            return isHealthy;

        } catch (RestClientException e) {
            logger.error("❌ ML Service unavailable: {} (URL: {}/health)", e.getMessage(), mlServiceUrl);
            return false;

        } catch (Exception e) {
            logger.error("❌ ML Service health check error: {}", e.getMessage());
            return false;
        }
    }
}
