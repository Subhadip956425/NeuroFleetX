package com.infosys.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Long id;
    private Long customerId;
    private Long vehicleId;
    private Long assignedDriverId;

    private String vehicleType;
    private Boolean isEv;
    private Integer seats;

    private String pickupLocation;
    private String dropoffLocation;

    // ✅ Use String for datetime - simpler and more reliable
    private String startTime;
    private String endTime;
    private String createdAt;
    private String updatedAt;

    private Double distance;
    private Integer duration;
    private Double price;

    private String status;
    private String rejectedBy;
    private String rejectReason;

    private String paymentStatus; // PENDING, COMPLETED, FAILED
    private Long paymentId;
    private Boolean isPaid;
}
