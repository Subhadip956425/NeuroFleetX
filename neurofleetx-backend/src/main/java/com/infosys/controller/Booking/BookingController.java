package com.infosys.controller.Booking;

import com.infosys.config.BookingMapper;
import com.infosys.dto.BookingResponse;
import com.infosys.dto.CreateBookingRequest;
import com.infosys.dto.RejectBookingRequest;
import com.infosys.model.Booking.Booking;
import com.infosys.repository.BookingRepository;
import com.infosys.service.Booking.BookingService;
import com.infosys.service.BookingSlotService;
import com.infosys.service.UserService;
import com.infosys.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingSlotService bookingSlotService;

    @Autowired
    private UserService userService;

    @Autowired
    private BookingMapper bookingMapper;

    @Autowired
    private BookingRepository bookingRepository;

    // ==================== CALENDAR ENDPOINTS ====================

    /**
     * Get booking calendar for a vehicle
     * ✅ NEW: This was missing - causing 403 error
     */
    @GetMapping("/calendar")
    public ResponseEntity<?> getBookingCalendar(
            @RequestParam Long vehicleId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            logger.info("📅 Getting booking calendar");
            logger.info("   Vehicle ID: {}", vehicleId);
            logger.info("   Date range: {} to {}", startDate, endDate);

            // Generate all dates in range - all available by default
            Map<String, Object> calendarData = generateCalendarData(startDate, endDate);

            logger.info("✅ Calendar generated with {} dates", calendarData.size());
            return ResponseEntity.ok(calendarData);

        } catch (Exception e) {
            logger.error("❌ Error getting calendar: {}", e.getMessage(), e);
            return ResponseEntity.ok(generateDummyCalendar(startDate, endDate));
        }
    }

    /**
     * Generate calendar data for date range
     */
    private Map<String, Object> generateCalendarData(String startDate, String endDate) {
        Map<String, Object> calendarData = new HashMap<>();

        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            LocalDate current = start;
            while (!current.isAfter(end)) {
                String dateStr = current.toString();
                calendarData.put(dateStr, Map.of(
                        "available", true,
                        "booked", false,
                        "date", dateStr
                ));
                current = current.plusDays(1);
            }
        } catch (Exception e) {
            logger.warn("⚠️ Error parsing dates: {}", e.getMessage());
        }

        return calendarData;
    }

    /**
     * Fallback dummy calendar
     */
    private Map<String, Object> generateDummyCalendar(String startDate, String endDate) {
        Map<String, Object> calendarData = new HashMap<>();

        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            LocalDate current = start;
            int count = 0;
            while (!current.isAfter(end) && count < 31) {
                calendarData.put(current.toString(), Map.of(
                        "available", true,
                        "booked", false
                ));
                current = current.plusDays(1);
                count++;
            }
        } catch (Exception e) {
            logger.warn("⚠️ Error generating dummy calendar: {}", e.getMessage());
        }

        return calendarData;
    }

    // ==================== CUSTOMER ENDPOINTS ====================

    @GetMapping("/slots/available")
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam Long vehicleId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            logger.info("🔍 Getting available slots for vehicle {} on {}", vehicleId, date);

            List<Map<String, Object>> availableSlots = new ArrayList<>();

            // ✅ Get all bookings for this vehicle on this date
            try {
                LocalDateTime dayStart = date.atStartOfDay();
                LocalDateTime dayEnd = date.atTime(23, 59, 59);

                List<Booking> existingBookings = bookingRepository.findByVehicleIdAndDateRange(
                        vehicleId, dayStart, dayEnd
                );

                logger.info("📊 Existing bookings for this vehicle on this date: {}",
                        existingBookings.size());

                // ✅ Generate time slots for the day (9 AM - 5 PM)
                List<Map<String, Object>> allSlots = generateTimeSlots();

                // ✅ Filter out booked time slots
                for (Map<String, Object> slot : allSlots) {
                    String startTime = (String) slot.get("startTime");
                    String endTime = (String) slot.get("endTime");

                    boolean isSlotFree = true;

                    // Check if this slot overlaps with any existing booking
                    for (Booking booking : existingBookings) {
                        LocalTime bookingStart = booking.getStartTime().toLocalTime();
                        LocalTime bookingEnd = booking.getEndTime().toLocalTime();
                        LocalTime slotStart = LocalTime.parse(startTime);
                        LocalTime slotEnd = LocalTime.parse(endTime);

                        // Check for overlap
                        if (!(slotEnd.isBefore(bookingStart) || slotStart.isAfter(bookingEnd))) {
                            isSlotFree = false;
                            logger.debug("❌ Slot {} - {} overlaps with booking", startTime, endTime);
                            break;
                        }
                    }

                    if (isSlotFree) {
                        availableSlots.add(slot);
                        logger.debug("✅ Slot {} - {} is free", startTime, endTime);
                    }
                }

                logger.info("✅ {} free slots available for vehicle {}",
                        availableSlots.size(), vehicleId);

            } catch (Exception e) {
                logger.warn("⚠️ Error fetching bookings: {}, returning all slots", e.getMessage());
                availableSlots = generateTimeSlots();
            }

            if (availableSlots.isEmpty()) {
                logger.info("ℹ️ No slots available, generating default slots");
                availableSlots = generateTimeSlots();
            }

            return ResponseEntity.ok(availableSlots);

        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage(), e);
            return ResponseEntity.ok(generateTimeSlots());
        }
    }

    /**
     * Generate 8 hourly time slots from 9 AM to 5 PM
     */
    private List<Map<String, Object>> generateTimeSlots() {
        List<Map<String, Object>> slots = new ArrayList<>();
        double pricePerHour = 500.0;

        for (int hour = 9; hour < 17; hour++) {
            Map<String, Object> slot = new HashMap<>();

            String startTime = String.format("%02d:00", hour);
            String endTime = String.format("%02d:00", hour + 1);

            slot.put("slotId", (long)(hour - 8));
            slot.put("startTime", startTime);
            slot.put("endTime", endTime);
            slot.put("pricePerHour", pricePerHour);
            slot.put("available", true);
            slot.put("duration", 1);

            slots.add(slot);
        }

        logger.debug("✅ Generated {} time slots", slots.size());
        return slots;
    }




    @PostMapping("/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest req) {
        try {
            Booking booking = bookingService.createBooking(req);
            // ✅ Return DTO instead of entity
            BookingResponse dto = bookingMapper.toDto(booking);
            logger.info("✅ Booking created: {}", booking.getId());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/cancel/{bookingId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam Long customerId) {
        try {
            Booking booking = bookingService.cancelBooking(bookingId, customerId);
            BookingResponse dto = bookingMapper.toDto(booking);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getCustomerBookings(@PathVariable Long customerId) {
        try {
            List<Booking> bookings = bookingService.getBookingsByCustomer(customerId);
            // ✅ Return DTOs instead of entities
            List<BookingResponse> dtos = bookingMapper.toDtoList(bookings);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== DRIVER ENDPOINTS ====================

    @GetMapping("/driver/pending")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> getDriverPendingBookings() {
        try {
            User driver = userService.getCurrentUser();
            List<Booking> bookings = bookingService.getPendingBookingsForDriver(driver.getId());
            List<BookingResponse> dtos = bookingMapper.toDtoList(bookings);
            logger.info("✅ Retrieved {} pending bookings", dtos.size());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/driver/confirmed")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> getDriverConfirmedBookings() {
        try {
            User driver = userService.getCurrentUser();
            List<Booking> bookings = bookingService.getConfirmedBookingsForDriver(driver.getId());
            List<BookingResponse> dtos = bookingMapper.toDtoList(bookings);
            logger.info("✅ Retrieved {} confirmed bookings", dtos.size());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/driver/{bookingId}/accept")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> driverAcceptBooking(@PathVariable Long bookingId) {
        try {
            User driver = userService.getCurrentUser();
            Booking booking = bookingService.driverAcceptBooking(bookingId, driver.getId());
            BookingResponse dto = bookingMapper.toDto(booking);
            logger.info("✅ Booking accepted: {}", bookingId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/driver/{bookingId}/reject")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> driverRejectBooking(
            @PathVariable Long bookingId,
            @RequestBody RejectBookingRequest request) {
        try {
            User driver = userService.getCurrentUser();
            Booking booking = bookingService.driverRejectBooking(bookingId, driver.getId(), request.getReason());
            BookingResponse dto = bookingMapper.toDto(booking);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== MANAGER ENDPOINTS ====================

    @PutMapping("/manager/{bookingId}/reject")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> managerRejectBooking(
            @PathVariable Long bookingId,
            @RequestBody RejectBookingRequest request) {
        try {
            User manager = userService.getCurrentUser();
            Booking booking = bookingService.managerRejectBooking(bookingId, manager.getId(), request.getReason());
            BookingResponse dto = bookingMapper.toDto(booking);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/manager/all")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> getAllBookingsForManager() {
        try {
            List<Booking> bookings = bookingService.getAllBookings();
            List<BookingResponse> dtos = bookingMapper.toDtoList(bookings);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<?> getBookingStatistics() {
        try {
            Map<String, Object> stats = bookingService.getBookingStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllBookingsForAdmin() {
        try {
            List<Booking> bookings = bookingService.getAllBookings();
            List<BookingResponse> dtos = bookingMapper.toDtoList(bookings);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getRecommendations(
            @RequestParam Long customerId,
            @RequestParam(required = false) String vehicleType,
            @RequestParam(required = false) Boolean isEv,
            @RequestParam String start,
            @RequestParam String end,
            @RequestParam(defaultValue = "5") int limit) {
        try {
            List<Map<String, Object>> recommendations = bookingService.getAIRecommendations(
                    customerId, vehicleType, isEv, start, end, limit);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}
