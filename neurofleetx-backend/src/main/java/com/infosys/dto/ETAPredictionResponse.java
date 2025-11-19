package com.infosys.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ETAPredictionResponse {

    // ✅ Main ETA prediction
    @JsonProperty("predicted_eta")
    private Double predicted_eta;

    // ✅ Alternative routes
    @JsonProperty("alternative_routes")
    private List<RouteAlternativeDTO> alternative_routes;

    // ✅ Response metadata
    private String status;
    private String message;

    // ✅ Helper method to convert from Map
    public void setAlternativeRoutesFromMap(List<Map<String, Object>> routes) {
        if (routes == null) return;

        this.alternative_routes = routes.stream()
                .map(this::convertMapToRouteDTO)
                .toList();
    }

    private RouteAlternativeDTO convertMapToRouteDTO(Map<String, Object> map) {
        return RouteAlternativeDTO.builder()
                .name((String) map.get("name"))
                .eta_minutes(((Number) map.get("eta_minutes")).doubleValue())
                .color((String) map.get("color"))
                .distance_km(((Number) map.get("distance_km")).doubleValue())
                .traffic_level(((Number) map.get("traffic_level")).doubleValue())
                .description((String) map.get("description"))
                .build();
    }
}
