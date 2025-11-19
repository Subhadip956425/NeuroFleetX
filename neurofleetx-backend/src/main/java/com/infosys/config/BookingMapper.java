package com.infosys.config;

import com.infosys.dto.BookingResponse;
import com.infosys.model.Booking.Booking;
import com.infosys.model.Payment;
import com.infosys.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Unified BookingMapper - Converts Booking entities to BookingResponse DTOs
 * Includes payment status integration
 */
@Component
public class BookingMapper {

    private static final DateTimeFormatter DATETIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Convert Booking entity to BookingResponse DTO
     * Includes all booking fields + payment status
     */
    public BookingResponse toDto(Booking booking) {
        if (booking == null) {
            return null;
        }

        // ✅ Check payment status for this booking
        Payment payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);

        return BookingResponse.builder()
                // ========== Core Booking Fields ==========
                .id(booking.getId())
                .customerId(booking.getCustomerId())
                .vehicleId(booking.getVehicleId())
                .assignedDriverId(booking.getAssignedDriverId())

                // ========== Vehicle Information ==========
                .vehicleType(booking.getVehicleType())
                .isEv(booking.getIsEv())
                .seats(booking.getSeats())

                // ========== Location Information ==========
                .pickupLocation(booking.getPickupLocation())
                .dropoffLocation(booking.getDropoffLocation())

                // ========== DateTime Fields (Formatted as Strings) ==========
                .startTime(booking.getStartTime() != null
                        ? booking.getStartTime().format(DATETIME_FORMATTER)
                        : null)
                .endTime(booking.getEndTime() != null
                        ? booking.getEndTime().format(DATETIME_FORMATTER)
                        : null)
                .createdAt(booking.getCreatedAt() != null
                        ? booking.getCreatedAt().format(DATETIME_FORMATTER)
                        : null)
                .updatedAt(booking.getUpdatedAt() != null
                        ? booking.getUpdatedAt().format(DATETIME_FORMATTER)
                        : null)

                // ========== Trip Details ==========
                .distance(booking.getDistance())
                .duration(booking.getDuration())
                .price(booking.getPrice())

                // ========== Status Information ==========
                .status(booking.getStatus() != null
                        ? booking.getStatus().toString()
                        : null)
                .rejectedBy(booking.getRejectedBy())
                .rejectReason(booking.getRejectReason())

                // ========== Payment Information (NEW) ==========
                .paymentStatus(payment != null
                        ? payment.getStatus().name()
                        : "PENDING")
                .paymentId(payment != null
                        ? payment.getId()
                        : null)
                .isPaid(payment != null
                        && "COMPLETED".equals(payment.getStatus().name()))

                .build();
    }

    /**
     * Convert list of Booking entities to list of BookingResponse DTOs
     */
    public List<BookingResponse> toDtoList(List<Booking> bookings) {
        if (bookings == null) {
            return List.of();
        }

        return bookings.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}
