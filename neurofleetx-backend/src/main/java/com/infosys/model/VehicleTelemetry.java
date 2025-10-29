package com.infosys.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleTelemetry {
    private Long vehicleId;
    private String vehicleName;
    private Double speed;
    private Double batteryLevel;
    private Double fuelLevel;
    private Double latitude;
    private Double longitude;
    private String status;
    private Long timestamp;
    
    // You can add more fields as needed
    private Double engineTemperature;
    private Double tireWear;
    private Integer mileage;
}
