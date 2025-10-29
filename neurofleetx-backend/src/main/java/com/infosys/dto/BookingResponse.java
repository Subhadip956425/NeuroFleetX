package com.infosys.dto;

import lombok.Data;

import java.time.LocalDateTime;

/*
  DTO returned to frontend for bookings.
*/
@Data
public class BookingResponse {
    private Long id;
    private Long customerId;
    private Long vehicleId;
    private String vehicleType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String pickupLocation;
    private String dropLocation;
    private Double price;
    private String status;
    private Boolean recommended;
}
