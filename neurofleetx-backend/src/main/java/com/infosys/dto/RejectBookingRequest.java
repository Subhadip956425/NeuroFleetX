package com.infosys.dto;

import lombok.Data;

@Data
public class RejectBookingRequest {
    private Long managerId;
    private Long driverId;
    private String reason;
    private String rejectedBy; // "MANAGER" or "DRIVER"
}
