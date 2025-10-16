package com.infosys.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDto {

    private Long customerId;
    private Long vehicleId;

    private String pickupLocation;
    private String dropoffLocation;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Double price;
}
