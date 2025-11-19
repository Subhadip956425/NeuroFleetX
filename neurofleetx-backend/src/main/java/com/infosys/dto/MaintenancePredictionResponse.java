package com.infosys.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePredictionResponse {

    @JsonProperty("status")
    private String status;  // "Healthy", "Due", "Critical"

    @JsonProperty("status_code")
    private Integer status_code;  // 0, 1, 2

    @JsonProperty("confidence")
    private Double confidence;

    @JsonProperty("days_until_maintenance")
    private Integer days_until_maintenance;

    @JsonProperty("next_maintenance_date")
    private String next_maintenance_date;

    @JsonProperty("health_score")
    private Double health_score;

    @JsonProperty("message")
    private String message;  // ✅ ADDED: Error message or status message
}
