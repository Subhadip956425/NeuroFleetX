package com.infosys.service.Booking;

import com.infosys.dto.CreateBookingRequest;
import com.infosys.model.*;
import com.infosys.model.AI.RouteStatus;
import com.infosys.model.Booking.Booking;
import com.infosys.model.Booking.BookingStatus;
import com.infosys.repository.*;
import com.infosys.repository.AI.RouteRepository;
import com.infosys.service.BookingSlotService;
import com.infosys.service.RouteOptimizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/*
 Purpose: Implements booking creation, availability checks, driver assignment, and notifications.
 Workflow:
 1. Customer creates booking → PENDING status → Broadcast to drivers with matching vehicle type
 2. Manager can REJECT → REJECTED status → Remove from driver queues
 3. Driver can ACCEPT → CONFIRMED status → Assign driver and vehicle
 4. Driver can REJECT → Stays PENDING for other drivers
 5. ✅ Driver accepts → Route created in driver_routes table
*/
@Service
public class BookingServiceImpl implements BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingServiceImpl.class);

    // ✅ Single instance of each repository (no duplicates)
    @Autowired
    private BookingRepository bookingRepo;

    @Autowired
    private VehicleRepository vehicleRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private VehicleStatusRepository vehicleStatusRepo;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private BookingSlotService bookingSlotService;

    @Autowired
    private RouteOptimizationService routeOptimizationService;

    @Autowired
    private DriverRouteRepository driverRouteRepository;

    // ==================== PRICE CALCULATION ====================

    private double computePrice(CreateBookingRequest req) {
        double hours = Math.max(1, Duration.between(req.getStartTime(), req.getEndTime()).toHours());
        double base = 10.0; // default per hour

        if ("SUV".equalsIgnoreCase(req.getVehicleType())) base = 15.0;
        if ("Van".equalsIgnoreCase(req.getVehicleType())) base = 12.0;
        if ("Truck".equalsIgnoreCase(req.getVehicleType())) base = 18.0;
        if ("Premium".equalsIgnoreCase(req.getVehicleType())) base = 25.0;
        if ("Bike".equalsIgnoreCase(req.getVehicleType())) base = 5.0;

        if (req.getIsEv() != null && req.getIsEv()) base += 2.0; // EV surcharge/discount

        return base * hours;
    }

    // ==================== CUSTOMER OPERATIONS ====================

    @Override
    @Transactional
    public Booking createBooking(CreateBookingRequest req) {
        // 1) Basic validation
        if (req.getStartTime().isAfter(req.getEndTime())) {
            throw new IllegalArgumentException("startTime must be before endTime");
        }

        // 2) Create booking without assigning vehicle (PENDING status)
        Booking booking = Booking.builder()
                .customerId(req.getCustomerId())
                .vehicleId(null)
                .vehicleType(req.getVehicleType())
                .isEv(req.getIsEv())
                .seats(req.getSeats())
                .pickupLocation(req.getPickupLocation())
                .dropoffLocation(req.getDropoffLocation())
                // ✅ NEW: Add coordinates for heatmap
                .pickupLat(req.getPickupLat())
                .pickupLng(req.getPickupLng())
                .dropoffLat(req.getDropoffLat())
                .dropoffLng(req.getDropoffLng())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .distance(req.getDistance())
                .duration(req.getDuration())
                .price(computePrice(req))
                .status(BookingStatus.PENDING)
                .rejectedBy(null)
                .rejectReason(null)
                .assignedDriverId(null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        booking = bookingRepo.save(booking);

        // 3) Broadcast to drivers
        String topic = "/topic/bookings/requests/" + req.getVehicleType().toUpperCase();
        messagingTemplate.convertAndSend(topic, booking);
        messagingTemplate.convertAndSend("/topic/bookings/manager", booking);

        logger.info("✅ Booking created: ID={}, Customer={}, Status={}",
                booking.getId(), req.getCustomerId(), BookingStatus.PENDING);

        return booking;
    }


    @Override
    @Transactional
    public Booking cancelBooking(Long bookingId, Long customerId) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Verify customer owns this booking
        if (!b.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized: Customer does not own this booking");
        }

        b.setStatus(BookingStatus.CANCELLED);
        b.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepo.save(b);

        // Free vehicle if it was CONFIRMED
        if (saved.getVehicleId() != null) {
            vehicleRepo.findById(saved.getVehicleId()).ifPresent(v -> {
                VehicleStatus availableStatus = vehicleStatusRepo.findByName("Available")
                        .orElseThrow(() -> new RuntimeException("VehicleStatus 'AVAILABLE' not found"));
                v.setStatus(availableStatus);
                vehicleRepo.save(v);
            });
        }

        // Broadcast cancellation
        messagingTemplate.convertAndSend("/topic/bookings", saved);
        logger.info("✅ Booking cancelled: ID={}", bookingId);

        return saved;
    }

    @Override
    public List<Booking> getBookingsByCustomer(Long customerId) {
        return bookingRepo.findByCustomerId(customerId);
    }

    // ==================== MANAGER OPERATIONS ====================

    @Override
    @Transactional
    public Booking managerRejectBooking(Long bookingId, Long managerId, String reason) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Check if can be cancelled
        if (b.getStatus() != BookingStatus.PENDING && b.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Can only cancel PENDING or CONFIRMED bookings");
        }

        // Set to CANCELLED (not REJECTED)
        b.setStatus(BookingStatus.CANCELLED);
        b.setRejectedBy("MANAGER");
        b.setRejectReason(reason);
        b.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepo.save(b);

        // Broadcast cancellation
        String topic = "/topic/bookings/requests/" + saved.getVehicleType().toUpperCase();
        messagingTemplate.convertAndSend(topic, Map.of(
                "action", "MANAGER_CANCELLED",
                "bookingId", saved.getId(),
                "booking", saved
        ));

        logger.info("✅ Booking manager-rejected: ID={}, Reason={}", bookingId, reason);

        return saved;
    }

    @Override
    public List<Booking> getAllBookings() {
        return bookingRepo.findAll();
    }

    @Override
    public List<Booking> getBookingsByStatus(String status) {
        BookingStatus bookingStatus = BookingStatus.valueOf(status.toUpperCase());
        return bookingRepo.findByStatus(bookingStatus);
    }

    @Override
    public Map<String, Object> getBookingStatistics() {
        List<Booking> allBookings = bookingRepo.findAll();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", allBookings.size());
        stats.put("pending", allBookings.stream().filter(b -> b.getStatus() == BookingStatus.PENDING).count());
        stats.put("confirmed", allBookings.stream().filter(b -> b.getStatus() == BookingStatus.CONFIRMED).count());
        stats.put("rejected", allBookings.stream().filter(b -> b.getStatus() == BookingStatus.REJECTED).count());
        stats.put("completed", allBookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count());
        stats.put("cancelled", allBookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count());

        return stats;
    }

    // ==================== DRIVER OPERATIONS ====================

    @Override
    public List<Booking> getPendingBookingsForDriver(Long driverId) {
        // Get driver's assigned vehicle to determine vehicle type
        User driver = userRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        // Get vehicle assigned to this driver
        Vehicle assignedVehicle = vehicleRepo.findByDriverId(driverId)
                .orElse(null);

        if (assignedVehicle == null) {
            // Driver has no assigned vehicle, return empty list
            logger.warn("⚠️ Driver {} has no assigned vehicle", driverId);
            return new ArrayList<>();
        }

        String vehicleType = assignedVehicle.getType() != null ?
                assignedVehicle.getType().getName() : null;

        if (vehicleType == null) {
            logger.warn("⚠️ Vehicle {} has no type assigned", assignedVehicle.getId());
            return new ArrayList<>();
        }

        // Return PENDING bookings for this vehicle type that are NOT rejected by manager
        List<Booking> pendingBookings = bookingRepo.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING)
                .filter(b -> vehicleType.equalsIgnoreCase(b.getVehicleType()))
                .filter(b -> b.getRejectedBy() == null || !"MANAGER".equals(b.getRejectedBy()))
                .filter(b -> b.getAssignedDriverId() == null) // Not yet assigned to any driver
                .collect(Collectors.toList());

        logger.info("✅ Retrieved {} pending bookings for driver {} (Vehicle Type: {})",
                pendingBookings.size(), driverId, vehicleType);

        return pendingBookings;
    }

    @Override
    public List<Booking> getConfirmedBookingsForDriver(Long driverId) {
        List<Booking> confirmedBookings = bookingRepo.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .filter(b -> driverId.equals(b.getAssignedDriverId()))
                .collect(Collectors.toList());

        logger.info("✅ Retrieved {} confirmed bookings for driver {}", confirmedBookings.size(), driverId);

        return confirmedBookings;
    }

    @Override
    @Transactional
    public Booking driverAcceptBooking(Long bookingId, Long driverId) {
        logger.info("🚗 Driver {} accepting booking {}", driverId, bookingId);

        // 1. Find booking
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // 2. Validate booking status
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be accepted. Current status: " + booking.getStatus());
        }

        // 3. Verify driver exists
        User driver = userRepo.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        // 4. Get driver's assigned vehicle
        Vehicle assignedVehicle = vehicleRepo.findByAssignedDriverId(driverId)
                .orElseThrow(() -> new RuntimeException("Driver has no assigned vehicle"));

        // 5. Check vehicle type matches booking
        String vehicleTypeName = assignedVehicle.getType() != null ?
                assignedVehicle.getType().getName() : null;

        if (vehicleTypeName == null || !vehicleTypeName.equalsIgnoreCase(booking.getVehicleType())) {
            throw new RuntimeException(String.format(
                    "Vehicle type mismatch. Booking requires %s, but driver has %s",
                    booking.getVehicleType(), vehicleTypeName
            ));
        }

        // 6. Update booking with driver and vehicle
        booking.setAssignedDriverId(driverId);
        booking.setVehicleId(assignedVehicle.getId());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setUpdatedAt(LocalDateTime.now());

        // 7. Save booking FIRST
        booking = bookingRepo.save(booking);
        logger.info("✅ Booking updated: ID={}, Driver={}, Vehicle={}",
                booking.getId(), driverId, assignedVehicle.getId());

        // 8. Update vehicle status to "In Use"
        try {
            VehicleStatus inUseStatus = vehicleStatusRepo.findByName("In Use")
                    .orElseThrow(() -> new RuntimeException("VehicleStatus 'In Use' not found"));
            assignedVehicle.setStatus(inUseStatus);
            assignedVehicle.setLastUpdated(LocalDateTime.now());
            vehicleRepo.save(assignedVehicle);
            logger.info("✅ Vehicle {} status updated to 'In Use'", assignedVehicle.getId());
        } catch (Exception e) {
            logger.error("❌ Failed to update vehicle status: {}", e.getMessage());
            // Continue - don't fail the transaction
        }

        // 9. Create route for driver ✅ FIXED BUILDER USAGE
        try {
            DriverRoute route = DriverRoute.builder()
                    .booking(booking)           // ✅ Booking entity
                    .driver(driver)             // ✅ User entity (driver)
                    .vehicle(assignedVehicle)   // ✅ Vehicle entity
                    .pickupLocation(booking.getPickupLocation())
                    .dropoffLocation(booking.getDropoffLocation())
                    .status(RouteStatus.ASSIGNED)
                    .distanceKm(0.0)
                    .estimatedTimeMinutes(0.0)
                    .trafficLevel(0.5)
                    .batteryLevelAtStart(assignedVehicle.getBatteryLevel())
                    .fuelLevelAtStart(assignedVehicle.getFuelLevel())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            driverRouteRepository.save(route);
            logger.info("✅ Route created: ID={}, Driver={}, Vehicle={}",
                    route.getId(), driverId, assignedVehicle.getId());

        } catch (Exception e) {
            logger.error("❌ Failed to create route: {}", e.getMessage(), e);
            // Log but don't fail transaction - route can be created later
        }

        // 10. Broadcast update via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/bookings", booking);
            messagingTemplate.convertAndSend("/topic/bookings/driver/" + driverId, booking);
            logger.info("✅ WebSocket notifications sent");
        } catch (Exception e) {
            logger.warn("⚠️ Failed to send WebSocket notification: {}", e.getMessage());
        }

        return booking;
    }



    @Override
    @Transactional
    public Booking driverRejectBooking(Long bookingId, Long driverId, String reason) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Booking stays PENDING for other drivers to accept
        b.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepo.save(b);

        logger.info("⚠️ Driver {} rejected booking {}: {}", driverId, bookingId, reason);

        return saved;
    }

    // ==================== LEGACY/COMPATIBILITY METHODS ====================

    @Override
    @Transactional
    public Booking confirmBooking(Long bookingId, Long managerId) {
        // This method is now deprecated - drivers handle confirmation
        // Kept for backward compatibility
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (b.getStatus() == BookingStatus.CONFIRMED) return b;

        // Auto-assign available vehicle (legacy behavior)
        List<Vehicle> candidates = vehicleRepo.findAll();
        candidates.removeIf(v -> {
            if (b.getIsEv() != null && b.getIsEv() && (v.getIsEv() == null || !v.getIsEv()))
                return true;

            if (b.getVehicleType() != null && !b.getVehicleType().isEmpty()) {
                String vehicleTypeName = v.getType() != null ? v.getType().getName() : null;
                if (vehicleTypeName == null || !b.getVehicleType().equalsIgnoreCase(vehicleTypeName))
                    return true;
            }

            return false;
        });

        Optional<Vehicle> opt = candidates.stream()
                .sorted(Comparator.comparing(Vehicle::getId))
                .filter(v -> {
                    List<Booking> overlap = bookingRepo.findOverlappingConfirmed(
                            v.getId(), b.getStartTime(), b.getEndTime());
                    return overlap.isEmpty();
                })
                .findFirst();

        if (opt.isPresent()) {
            Vehicle v = opt.get();
            b.setVehicleId(v.getId());
            b.setStatus(BookingStatus.CONFIRMED);
            b.setUpdatedAt(LocalDateTime.now());

            VehicleStatus inUseStatus = vehicleStatusRepo.findByName("IN_USE")
                    .orElseThrow(() -> new RuntimeException("VehicleStatus 'IN_USE' not found"));
            v.setStatus(inUseStatus);
            vehicleRepo.save(v);

            Booking saved = bookingRepo.save(b);
            messagingTemplate.convertAndSend("/topic/bookings", saved);
            logger.info("✅ Booking {} confirmed (legacy method)", bookingId);
            return saved;
        }

        logger.warn("⚠️ Could not confirm booking {} - no available vehicles", bookingId);
        return b; // Cannot confirm; remain pending
    }

    @Override
    public List<Booking> getBookingsForVehicle(Long vehicleId) {
        return bookingRepo.findOverlappingConfirmed(
                vehicleId,
                LocalDateTime.now().minusYears(1),
                LocalDateTime.now().plusYears(1)
        );
    }

    @Override
    public List<Booking> getBookingsForDriver(Long driverId) {
        return bookingRepo.findByDriverId(driverId);
    }

    // ==================== AI RECOMMENDATIONS ====================

    @Override
    public List<Map<String, Object>> getAIRecommendations(
            Long customerId, String vehicleType, Boolean isEv,
            String start, String end, int limit) {

        // Parse datetime strings
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        LocalDateTime startTime = LocalDateTime.parse(start, formatter);
        LocalDateTime endTime = LocalDateTime.parse(end, formatter);

        // Get available vehicles
        List<Vehicle> allVehicles = vehicleRepo.findAll();

        // Filter by criteria
        List<Vehicle> filtered = allVehicles.stream()
                .filter(v -> {
                    // Filter by vehicle type if specified
                    if (vehicleType != null && !vehicleType.isEmpty()) {
                        String vType = v.getType() != null ? v.getType().getName() : null;
                        if (vType == null || !vType.equalsIgnoreCase(vehicleType)) {
                            return false;
                        }
                    }

                    // Filter by EV if specified
                    if (isEv != null && isEv) {
                        if (v.getIsEv() == null || !v.getIsEv()) {
                            return false;
                        }
                    }

                    // Check availability for time slot
                    List<Booking> overlaps = bookingRepo.findOverlappingConfirmed(
                            v.getId(), startTime, endTime);
                    return overlaps.isEmpty();
                })
                .limit(limit)
                .collect(Collectors.toList());

        // Convert to recommendation format
        List<Map<String, Object>> recommendations = filtered.stream().map(v -> {
            Map<String, Object> rec = new HashMap<>();
            rec.put("id", v.getId());
            rec.put("name", v.getName());
            rec.put("type", v.getType() != null ? v.getType().getName() : "Unknown");
            rec.put("vehicleType", v.getType() != null ? v.getType().getName() : "Unknown");
            rec.put("batteryLevel", v.getBatteryLevel());
            rec.put("fuelLevel", v.getFuelLevel());
            rec.put("isEv", v.getIsEv());
            rec.put("matchScore", calculateMatchScore(v, customerId)); // AI scoring
            return rec;
        }).collect(Collectors.toList());

        logger.info("✅ Generated {} AI recommendations for customer {}", recommendations.size(), customerId);

        return recommendations;
    }

    private double calculateMatchScore(Vehicle vehicle, Long customerId) {
        // Simple AI scoring based on vehicle condition
        double score = 0.5; // base score

        if (vehicle.getBatteryLevel() != null && vehicle.getBatteryLevel() > 80) score += 0.2;
        if (vehicle.getFuelLevel() != null && vehicle.getFuelLevel() > 70) score += 0.2;
        if (vehicle.getIsEv() != null && vehicle.getIsEv()) score += 0.1;

        return Math.min(1.0, score);
    }

    public List<Map<String, Object>> getRecommendedSlots(Long vehicleId, LocalDate date) {
        List<BookingSlot> slots = bookingSlotService.getAvailableSlots(vehicleId, date);
        List<Map<String, Object>> recommended = new ArrayList<>();

        for (BookingSlot slot : slots) {
            Map<String, Object> slotInfo = new HashMap<>();
            slotInfo.put("slotId", slot.getId());
            slotInfo.put("startTime", slot.getStartTime().toString());
            slotInfo.put("endTime", slot.getEndTime().toString());
            slotInfo.put("pricePerHour", slot.getPricePerHour());
            slotInfo.put("totalPrice", calculateSlotPrice(slot));
            recommended.add(slotInfo);
        }

        logger.info("✅ {} Recommended slots for Vehicle {}", recommended.size(), vehicleId);
        return recommended;
    }

    private Double calculateSlotPrice(BookingSlot slot) {
        long duration = java.time.temporal.ChronoUnit.HOURS.between(slot.getStartTime(), slot.getEndTime());
        return slot.getPricePerHour() * Math.max(1, duration);
    }

    /**
     * Get availability calendar
     */
    public Map<LocalDate, List<Map<String, Object>>> getBookingCalendar(Long vehicleId, LocalDate startDate, LocalDate endDate) {
        return bookingSlotService.getAvailabilityCalendar(vehicleId, startDate, endDate);
    }

    @Override
    public void createRouteFromBooking(Booking booking, Long driverId) {

    }
}
