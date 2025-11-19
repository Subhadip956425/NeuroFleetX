package com.infosys.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ETAPredictionRequest {

    @JsonProperty("distanceKm")
    private Double distanceKm;

    @JsonProperty("avgSpeed")
    private Double avgSpeed;

    @JsonProperty("trafficLevel")
    private Double trafficLevel;

    @JsonProperty("batteryLevel")
    private Double batteryLevel;

    @JsonProperty("fuelLevel")
    private Double fuelLevel;
}
