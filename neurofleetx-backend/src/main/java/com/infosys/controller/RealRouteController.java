package com.infosys.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RealRouteController {  // ✅ RENAMED from RouteController

    private static final Logger logger = LoggerFactory.getLogger(RealRouteController.class);
    private static final String OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

    @GetMapping("/real-route")
    public ResponseEntity<?> getRealRoute(
            @RequestParam double startLat,
            @RequestParam double startLng,
            @RequestParam double endLat,
            @RequestParam double endLng) {
        
        try {
            logger.info("🗺️ Fetching real route: [{}, {}] → [{}, {}]", 
                startLat, startLng, endLat, endLng);

            String url = String.format(
                "%s/%f,%f;%f,%f?overview=full&geometries=geojson",
                OSRM_URL, startLng, startLat, endLng, endLat
            );

            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            logger.info("✅ Route fetched successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Error fetching route: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to fetch route",
                "message", e.getMessage()
            ));
        }
    }
}
