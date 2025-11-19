package com.infosys.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingAvailabilityDTO {
    private LocalDateTime date;
    private List<TimeSlotDTO> availableSlots;
    private String vehicleType;
    private Boolean isEv;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class TimeSlotDTO {
    private String startTime;        // "09:00"
    private String endTime;          // "17:00"
    private Double pricePerHour;
    private Boolean isAvailable;
}
