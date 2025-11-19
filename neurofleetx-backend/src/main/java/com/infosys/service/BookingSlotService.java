package com.infosys.service;

import com.infosys.model.BookingSlot;
import com.infosys.model.Vehicle;
import com.infosys.repository.BookingSlotRepository;
import com.infosys.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class BookingSlotService {

    private static final Logger logger = LoggerFactory.getLogger(BookingSlotService.class);

    @Autowired
    private BookingSlotRepository bookingSlotRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    /**
     * Create booking slots for a vehicle
     */
    public List<BookingSlot> createSlotsForVehicle(Long vehicleId, LocalDate date, 
                                                    LocalTime startTime, LocalTime endTime, 
                                                    Double pricePerHour) {
        try {
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));

            List<BookingSlot> slots = new ArrayList<>();

            // Create hourly slots
            LocalTime current = startTime;
            while (current.isBefore(endTime)) {
                LocalTime nextHour = current.plusHours(1);
                if (nextHour.isAfter(endTime)) {
                    nextHour = endTime;
                }

                BookingSlot slot = BookingSlot.builder()
                        .vehicle(vehicle)
                        .slotDate(date)
                        .startTime(current)
                        .endTime(nextHour)
                        .pricePerHour(pricePerHour)
                        .isAvailable(true)
                        .build();

                slots.add(bookingSlotRepository.save(slot));
                current = nextHour;
            }

            logger.info("✅ Created {} booking slots for Vehicle {}", slots.size(), vehicleId);
            return slots;

        } catch (Exception e) {
            logger.error("❌ Slot Creation Error: {}", e.getMessage());
            throw new RuntimeException("Failed to create booking slots", e);
        }
    }

    /**
     * Get available slots for a vehicle on a specific date
     */
    public List<BookingSlot> getAvailableSlots(Long vehicleId, LocalDate date) {
        return bookingSlotRepository.findAvailableSlotsByVehicleAndDate(vehicleId, date);
    }

    /**
     * Get available slots within a date range
     */
    public List<BookingSlot> getAvailableSlotsByDateRange(Long vehicleId, LocalDate startDate, LocalDate endDate) {
        return bookingSlotRepository.findAvailableSlotsByVehicleAndDateRange(vehicleId, startDate, endDate);
    }

    /**
     * Get availability calendar for a vehicle
     */
    public Map<LocalDate, List<Map<String, Object>>> getAvailabilityCalendar(Long vehicleId, LocalDate startDate, LocalDate endDate) {
        List<BookingSlot> slots = getAvailableSlotsByDateRange(vehicleId, startDate, endDate);
        Map<LocalDate, List<Map<String, Object>>> calendar = new LinkedHashMap<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            List<Map<String, Object>> daySlots = new ArrayList<>();
            
            for (BookingSlot slot : slots) {
                if (slot.getSlotDate().equals(date)) {
                    Map<String, Object> slotInfo = new HashMap<>();
                    slotInfo.put("slotId", slot.getId());
                    slotInfo.put("startTime", slot.getStartTime().toString());
                    slotInfo.put("endTime", slot.getEndTime().toString());
                    slotInfo.put("pricePerHour", slot.getPricePerHour());
                    slotInfo.put("isAvailable", slot.getIsAvailable());
                    daySlots.add(slotInfo);
                }
            }

            if (!daySlots.isEmpty()) {
                calendar.put(date, daySlots);
            }
        }

        logger.info("✅ Availability Calendar Generated for Vehicle {}", vehicleId);
        return calendar;
    }

    /**
     * Mark slot as booked
     */
    public void markSlotAsBooked(Long slotId) {
        BookingSlot slot = bookingSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));
        slot.setIsAvailable(false);
        bookingSlotRepository.save(slot);
        logger.info("✅ Slot {} marked as booked", slotId);
    }
}
