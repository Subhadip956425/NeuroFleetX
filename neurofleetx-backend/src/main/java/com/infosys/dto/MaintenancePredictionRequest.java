package com.infosys.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenancePredictionRequest {
    private Long vehicleId;
    private Double mileage;
    private Double engineTemp;
    private Double tirePressure;
    private Double batteryHealth;
    private Double oilLevel;
    private Double brakeWear;
    private Integer daysSinceLastMaintenance;
}
