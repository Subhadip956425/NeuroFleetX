package com.infosys.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRecommendationResponse {
    private Long vehicle_id;
    private Double confidence_score;
    private Boolean is_ai_recommended;

    private String type;
    private Integer seats;
    private Boolean isEv;
    private Integer batteryLevel;
    private Integer fuelLevel;
    private Integer rank;
    private String priceRange;
    private String name;
}
