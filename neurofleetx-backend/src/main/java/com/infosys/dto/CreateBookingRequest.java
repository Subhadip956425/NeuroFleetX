package com.infosys.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBookingRequest {
    private Long customerId;
    private Long vehicleId;
    private String vehicleType;
    private Boolean isEv;
    private Integer seats;

    // Location text addresses
    private String pickupLocation;
    private String dropoffLocation;

    // Location coordinates (NEW)
    private Double pickupLat;
    private Double pickupLng;
    private Double dropoffLat;
    private Double dropoffLng;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Double distance;
    private Integer duration;
}
