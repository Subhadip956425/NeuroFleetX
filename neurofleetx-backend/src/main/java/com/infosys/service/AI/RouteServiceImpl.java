package com.infosys.service.AI;

import com.infosys.dto.CreateRouteRequest;
import com.infosys.model.AI.Route;
import com.infosys.model.AI.RouteStatus;
import com.infosys.model.User;
import com.infosys.model.Vehicle;
import com.infosys.repository.AI.RouteRepository;
import com.infosys.repository.UserRepository;
import com.infosys.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RouteServiceImpl implements RouteService {

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Injected for WebSocket push


    private static final String PYTHON_URL = "http://localhost:5001/predict-eta";

    @Override
    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    @Override
    public Route assignRoute(Long routeId, Long vehicleId, Long driverId) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found"));
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        route.setVehicle(vehicle);
        route.setDriver(driver);
        route.setStatus(RouteStatus.ASSIGNED);
        route.setUpdatedAt(LocalDateTime.now());

        // Optional: recalc ETA with vehicle-specific telemetry (e.g., current speed/battery)
        try {
            // craft new payload using vehicle telemetry if available
            Map<String, Object> payload = new HashMap<>();
            payload.put("distanceKm", route.getDistanceKm() != null ? route.getDistanceKm() : estimateDistance(null));
            payload.put("avgSpeed", 45.0);
            payload.put("trafficLevel", 0.5);
            payload.put("batteryLevel", 80.0);
            payload.put("fuelLevel", 60.0);

            ResponseEntity<Map> resp = restTemplate.postForEntity(PYTHON_URL, payload, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Object val = resp.getBody().get("predicted_eta");
                if (val != null) {
                    route.setPredictedEta(Double.valueOf(val.toString()));
                }
            }
        } catch (Exception ex) {
            System.err.println("ETA recalculation failed: " + ex.getMessage());
        }

        route = routeRepository.save(route);

        // Broadcast the assignment (so driver & manager see it instantly)
        messagingTemplate.convertAndSend("/topic/routes", route);

        return route;
    }


    @Override
    public List<Route> filterRoutes(String status, Long driverId) {
        RouteStatus routeStatus = null;
        if (status != null) {
            routeStatus = RouteStatus.valueOf(status.toUpperCase()); // Convert String -> Enum
        }

        if (status != null && driverId != null) {
            return routeRepository.findByStatusAndDriver_Id(routeStatus, driverId);
        } else if (status != null) {
            return routeRepository.findByStatus(routeStatus);
        } else if (driverId != null) {
            return routeRepository.findByDriver_Id(driverId);
        } else {
            return routeRepository.findAll();
        }
    }


    // -----------------------------
    // Create route & call AI for ETA
    // -----------------------------
    @Override
    public Route createRoute(CreateRouteRequest req) {
        Route route = new Route();
        route.setOrigin(req.getOrigin());
        route.setDestination(req.getDestination());
        route.setDistanceKm(req.getDistanceKm());
        route.setStatus(RouteStatus.PENDING); // or RouteStatus.PENDING
        route.setCreatedAt(LocalDateTime.now());
        route.setUpdatedAt(LocalDateTime.now());

        // First save minimal route so we have an id (optional)
        route = routeRepository.save(route);

        // Prepare payload for Python service
        Map<String, Object> payload = new HashMap<>();
        payload.put("distanceKm", route.getDistanceKm() != null ? route.getDistanceKm() : estimateDistance(req));
        payload.put("avgSpeed", req.getAvgSpeed() != null ? req.getAvgSpeed() : 40.0);      // default assumption
        payload.put("trafficLevel", req.getTrafficLevel() != null ? req.getTrafficLevel() : 0.5);
        payload.put("batteryLevel", req.getBatteryLevel() != null ? req.getBatteryLevel() : 80.0);
        payload.put("fuelLevel", req.getFuelLevel() != null ? req.getFuelLevel() : 60.0);

        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity(PYTHON_URL, payload, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Object val = resp.getBody().get("predicted_eta");
                if (val != null) {
                    Double eta = Double.valueOf(val.toString());
                    route.setPredictedEta(eta);
                }
            }
        } catch (Exception ex) {
            // log error — but continue gracefully
            System.err.println("ETA service call failed: " + ex.getMessage());
            route.setPredictedEta(null);
        }

        // persist final route
        route.setUpdatedAt(LocalDateTime.now());
        route = routeRepository.save(route);

        // broadcast to WebSocket topic so UIs get real-time update
        messagingTemplate.convertAndSend("/topic/routes", route);

        return route;
    }

    @Override
    public Route assignDriverAndVehicle(Long routeId, Long driverId, Long vehicleId) {
        Route route = routeRepository.findById(routeId).orElseThrow();
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElseThrow();
        User driver = userRepository.findById(driverId).orElseThrow();

        route.setVehicle(vehicle);
        route.setDriver(driver);
        route.setStatus(RouteStatus.ASSIGNED);
        route.setUpdatedAt(LocalDateTime.now());

        Route updatedRoute = routeRepository.save(route);

        // ✅ Push live update to subscribed clients
        messagingTemplate.convertAndSend("/topic/routes", updatedRoute);

        return updatedRoute;
    }

    @Override
    public List<Route> getRoutesForManager() {
        return routeRepository.findAll();
    }

    @Override
    public List<Route> getRoutesForDriver(Long driverId) {
        return routeRepository.findByDriver_Id(driverId);
    }

    @Override
    public Route updateRouteStatus(Long routeId, String status) {
        Route route = routeRepository.findById(routeId).orElseThrow();
        route.setStatus(RouteStatus.valueOf(status.toUpperCase()));
        route.setUpdatedAt(LocalDateTime.now());

        Route updatedRoute = routeRepository.save(route);

        // ✅ Push status update
        messagingTemplate.convertAndSend("/topic/routes", updatedRoute);

        return updatedRoute;
    }

    // crude distance estimator placeholder - replace with a proper geospatial calc if available
    private Double estimateDistance(CreateRouteRequest req) {
        // fallback default distance
        return 10.0;
    }
}
