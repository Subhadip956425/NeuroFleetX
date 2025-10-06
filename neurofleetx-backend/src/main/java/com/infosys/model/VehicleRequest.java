package com.infosys.model;

import lombok.Data;

@Data
public class VehicleRequest {
    private String name;
    private Long typeId;
    private Long statusId;
    private Long assignedDriverId; // Optional
    private Double batteryLevel;
    private Double fuelLevel;
    private Double speed;
    private Double latitude;
    private Double longitude;
}

