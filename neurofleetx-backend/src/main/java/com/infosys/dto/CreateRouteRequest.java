package com.infosys.dto;

import lombok.Data;

/*
  Purpose: DTO for creating a route from frontend (manager/admin).
  origin/destination can be plain strings or "lat,lng" coordinates.
*/
@Data
public class CreateRouteRequest {
    private String origin;
    private String destination;
    private Double distanceKm;       // optional if backend computes
    private Double avgSpeed;         // optional hint for ETA model
    private Double trafficLevel;     // optional numeric (0..1) hint
    private Double batteryLevel;     // optional
    private Double fuelLevel;        // optional
}
