package com.infosys.dto;

import lombok.Data;
import java.time.LocalDateTime;

/*
 Purpose: Payload from frontend when creating a booking
*/
@Data
public class CreateBookingRequest {
    private Long customerId;
    private String vehicleType;   // desired type or null
    private Boolean isEv;         // request EV
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer seats;
    private String pickupLocation;
    private String dropoffLocation;
}

