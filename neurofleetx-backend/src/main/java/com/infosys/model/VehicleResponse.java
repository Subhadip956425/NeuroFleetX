package com.infosys.model;

import lombok.Data;

@Data
public class VehicleResponse {
    private Long id;
    private String name;
    private String type;
    private String status;
    private double batteryLevel;
    private double fuelLevel;
    private double speed;
    private double latitude;
    private double longitude;

    // assigned driver info
    private Long assignedDriverId;
    private String assignedDriverName;
}

