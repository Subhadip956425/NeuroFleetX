package com.infosys.service.Booking;

import com.infosys.dto.CreateBookingRequest;
import com.infosys.model.Booking.Booking;
import com.infosys.model.Booking.BookingStatus;
import com.infosys.model.User;
import com.infosys.model.Vehicle;
import com.infosys.model.VehicleStatus;
import com.infosys.repository.BookingRepository;
import com.infosys.repository.UserRepository;
import com.infosys.repository.VehicleRepository;
import com.infosys.repository.VehicleStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
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
*/
@Service
public class BookingServiceImpl implements BookingService {

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
                .vehicleId(null) // No vehicle assigned yet
                .vehicleType(req.getVehicleType())
                .isEv(req.getIsEv())
                .seats(req.getSeats())
                .pickupLocation(req.getPickupLocation())
                .dropoffLocation(req.getDropoffLocation())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .price(computePrice(req))
                .status(BookingStatus.PENDING) // Always PENDING at creation
                .rejectedBy(null) // Not rejected
                .rejectReason(null)
                .assignedDriverId(null) // No driver assigned yet
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        booking = bookingRepo.save(booking);

        // 3) Broadcast to drivers subscribed to this vehicle type
        // WebSocket topic: /topic/bookings/requests/<vehicleType>
        String topic = "/topic/bookings/requests/" + req.getVehicleType().toUpperCase();
        messagingTemplate.convertAndSend(topic, booking);

        // Also broadcast to manager/admin dashboards
        messagingTemplate.convertAndSend("/topic/bookings/manager", booking);

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
                VehicleStatus availableStatus = vehicleStatusRepo.findByName("AVAILABLE")
                        .orElseThrow(() -> new RuntimeException("VehicleStatus 'AVAILABLE' not found"));
                v.setStatus(availableStatus);
                vehicleRepo.save(v);
            });
        }

        // Broadcast cancellation
        messagingTemplate.convertAndSend("/topic/bookings", saved);
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

        // Update booking to REJECTED status
        b.setStatus(BookingStatus.REJECTED);
        b.setRejectedBy("MANAGER");
        b.setRejectReason(reason);
        b.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepo.save(b);

        // Broadcast rejection to remove from driver dashboards immediately
        String topic = "/topic/bookings/requests/" + saved.getVehicleType().toUpperCase();
        messagingTemplate.convertAndSend(topic, Map.of(
                "action", "MANAGER_REJECTED",
                "bookingId", saved.getId(),
                "booking", saved
        ));

        // Notify customer
        messagingTemplate.convertAndSend("/topic/bookings/customer/" + saved.getCustomerId(), saved);

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
        Vehicle assignedVehicle = vehicleRepo.findByAssignedDriverId(driverId)
                .orElse(null);

        if (assignedVehicle == null) {
            // Driver has no assigned vehicle, return empty list
            return new ArrayList<>();
        }

        String vehicleType = assignedVehicle.getType() != null ?
                assignedVehicle.getType().getName() : null;

        if (vehicleType == null) {
            return new ArrayList<>();
        }

        // Return PENDING bookings for this vehicle type that are NOT rejected by manager
        return bookingRepo.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING)
                .filter(b -> vehicleType.equalsIgnoreCase(b.getVehicleType()))
                .filter(b -> b.getRejectedBy() == null || !"MANAGER".equals(b.getRejectedBy()))
                .filter(b -> b.getAssignedDriverId() == null) // Not yet assigned to any driver
                .collect(Collectors.toList());
    }

    @Override
    public List<Booking> getConfirmedBookingsForDriver(Long driverId) {
        return bookingRepo.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .filter(b -> driverId.equals(b.getAssignedDriverId()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Booking driverAcceptBooking(Long bookingId, Long driverId) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Verify booking is PENDING and not rejected
        if (b.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Booking is not in PENDING status");
        }

        if ("MANAGER".equals(b.getRejectedBy())) {
            throw new RuntimeException("Booking was rejected by manager");
        }

        // Get driver's assigned vehicle
        Vehicle assignedVehicle = vehicleRepo.findByAssignedDriverId(driverId)
                .orElseThrow(() -> new RuntimeException("Driver has no assigned vehicle"));

        // Verify vehicle type matches
        String vehicleType = assignedVehicle.getType() != null ?
                assignedVehicle.getType().getName() : null;

        if (vehicleType == null || !vehicleType.equalsIgnoreCase(b.getVehicleType())) {
            throw new RuntimeException("Vehicle type mismatch");
        }

        // Check for overlapping bookings for this vehicle
        List<Booking> overlaps = bookingRepo.findOverlappingConfirmed(
                assignedVehicle.getId(), b.getStartTime(), b.getEndTime());

        if (!overlaps.isEmpty()) {
            throw new RuntimeException("Vehicle is already booked for this time period");
        }

        // Accept booking
        b.setStatus(BookingStatus.CONFIRMED);
        b.setAssignedDriverId(driverId);
        b.setVehicleId(assignedVehicle.getId());
        b.setUpdatedAt(LocalDateTime.now());

        // Mark vehicle as IN_USE
        VehicleStatus inUseStatus = vehicleStatusRepo.findByName("In Use")
                .orElseThrow(() -> new RuntimeException("VehicleStatus 'In Use' not found"));
        assignedVehicle.setStatus(inUseStatus);
        vehicleRepo.save(assignedVehicle);

        Booking saved = bookingRepo.save(b);

        // Broadcast to customer
        messagingTemplate.convertAndSend("/topic/bookings/customer/" + saved.getCustomerId(), saved);

        // Broadcast to manager dashboard
        messagingTemplate.convertAndSend("/topic/bookings/manager", saved);

        // Remove from other drivers' queues
        String topic = "/topic/bookings/requests/" + saved.getVehicleType().toUpperCase();
        messagingTemplate.convertAndSend(topic, Map.of(
                "action", "DRIVER_ACCEPTED",
                "bookingId", saved.getId(),
                "driverId", driverId
        ));

        return saved;
    }

    @Override
    @Transactional
    public Booking driverRejectBooking(Long bookingId, Long driverId, String reason) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Booking stays PENDING but track driver rejection
        // You could add a field `driverRejections` to track which drivers rejected
        b.setUpdatedAt(LocalDateTime.now());

        // Optional: Add to rejection log (if you want to track)
        // For now, booking remains PENDING for other drivers

        Booking saved = bookingRepo.save(b);

        // Log or notify (optional)
        System.out.println("Driver " + driverId + " rejected booking " + bookingId + ": " + reason);

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
            return saved;
        }

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
        return filtered.stream().map(v -> {
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
    }

    private double calculateMatchScore(Vehicle vehicle, Long customerId) {
        // Simple AI scoring based on vehicle condition
        double score = 0.5; // base score

        if (vehicle.getBatteryLevel() > 80) score += 0.2;
        if (vehicle.getFuelLevel() > 70) score += 0.2;
        if (vehicle.getIsEv() != null && vehicle.getIsEv()) score += 0.1;

        return Math.min(1.0, score);
    }
}
