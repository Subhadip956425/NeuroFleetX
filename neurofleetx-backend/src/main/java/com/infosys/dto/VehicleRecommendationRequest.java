package com.infosys.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRecommendationRequest {
    private Long customerId;
    private String vehicleType;      // "Car", "Van", "Truck", "EV", "Bike"
    private Boolean isEvPreferred;
    private Integer seatsNeeded;
    private Double distanceKm;
    private String priceRange;       // "Budget", "Standard", "Premium"
    private String startTime;        // ISO format: "2025-11-02T10:00:00"
    private String endTime;
}
