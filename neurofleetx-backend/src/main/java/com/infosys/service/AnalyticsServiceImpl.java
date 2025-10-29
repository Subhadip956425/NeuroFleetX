package com.infosys.service;

import com.infosys.model.Booking.Booking;
import com.infosys.model.Vehicle;
import com.infosys.repository.BookingRepository;
import com.infosys.repository.VehicleRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;

    @Autowired
    public AnalyticsServiceImpl(VehicleRepository vehicleRepository,
                                BookingRepository bookingRepository) {
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
    }

    // ==================== FLEET DISTRIBUTION ====================

    @Override
    public Map<String, Object> getFleetDistribution() {
        List<Vehicle> vehicles = vehicleRepository.findAll();

        Map<String, Object> distribution = new HashMap<>();

        // Group vehicles by location (latitude/longitude clusters)
        List<Map<String, Object>> locationData = vehicles.stream()
                .map(v -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("id", v.getId());
                    point.put("name", v.getName());
                    point.put("lat", v.getLatitude());
                    point.put("lng", v.getLongitude());
                    point.put("status", v.getStatus().getName());
                    point.put("type", v.getType().getName());
                    return point;
                })
                .collect(Collectors.toList());

        distribution.put("vehicles", locationData);
        distribution.put("total", vehicles.size());
        distribution.put("timestamp", LocalDateTime.now());

        return distribution;
    }

    // ==================== TRIP HEATMAP DATA ====================

    @Override
    public List<Map<String, Object>> getTripHeatmapData(String startDate, String endDate) {
        List<Booking> bookings = bookingRepository.findAll();

        // Group bookings by pickup location coordinates
        Map<String, Long> locationFrequency = bookings.stream()
                .filter(b -> b.getPickupLocation() != null)
                .collect(Collectors.groupingBy(
                        Booking::getPickupLocation,
                        Collectors.counting()
                ));

        // Convert to heatmap format (lat, lng, intensity)
        return locationFrequency.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> point = new HashMap<>();
                    // Parse location (assuming format: "lat,lng" or address)
                    point.put("location", entry.getKey());
                    point.put("intensity", entry.getValue());
                    // TODO: Add geocoding to convert address to lat/lng if needed
                    return point;
                })
                .collect(Collectors.toList());
    }

    // ==================== KPI SUMMARY ====================

    @Override
    public Map<String, Object> getKPISummary() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();

        Map<String, Object> kpi = new HashMap<>();

        // Fleet KPIs
        kpi.put("totalFleet", vehicles.size());
        kpi.put("activeVehicles", vehicles.stream()
                .filter(v -> "In Use".equals(v.getStatus().getName()))
                .count());
        kpi.put("availableVehicles", vehicles.stream()
                .filter(v -> "Available".equals(v.getStatus().getName()))
                .count());

        // Booking KPIs (Today)
        LocalDate today = LocalDate.now();
        long tripsToday = bookings.stream()
                .filter(b -> b.getStartTime() != null &&
                        b.getStartTime().toLocalDate().equals(today))
                .count();
        kpi.put("tripsToday", tripsToday);

        // Active routes (CONFIRMED status)
        long activeRoutes = bookings.stream()
                .filter(b -> "CONFIRMED".equals(b.getStatus()))
                .count();
        kpi.put("activeRoutes", activeRoutes);

        // Revenue estimate (mock - replace with actual pricing logic)
        double estimatedRevenue = bookings.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()))
                .count() * 150.0; // Mock: $150 per completed trip
        kpi.put("estimatedRevenue", estimatedRevenue);

        return kpi;
    }

    // ==================== HOURLY RENTAL ACTIVITY ====================

    @Override
    public List<Map<String, Object>> getHourlyRentalActivity(String dateStr) {
        LocalDate targetDate = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
        List<Booking> bookings = bookingRepository.findAll();

        // Group bookings by hour (0-23)
        Map<Integer, Long> hourlyActivity = bookings.stream()
                .filter(b -> b.getStartTime() != null &&
                        b.getStartTime().toLocalDate().equals(targetDate))
                .collect(Collectors.groupingBy(
                        b -> b.getStartTime().getHour(),
                        Collectors.counting()
                ));

        // Fill all 24 hours (0-23) with 0 if no data
        List<Map<String, Object>> result = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", hour);
            hourData.put("bookings", hourlyActivity.getOrDefault(hour, 0L));
            result.add(hourData);
        }

        return result;
    }

    // ==================== CSV/PDF GENERATION (Placeholder) ====================

    @Override
    public byte[] generateCSVReport(String reportType, String startDate, String endDate) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(baos);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT
                     .withHeader("ID", "Name", "Type", "Status", "Battery", "Fuel"))) {

            List<Vehicle> vehicles = vehicleRepository.findAll();

            for (Vehicle v : vehicles) {
                csvPrinter.printRecord(
                        v.getId(),
                        v.getName(),
                        v.getType().getName(),
                        v.getStatus().getName(),
                        v.getBatteryLevel(),
                        v.getFuelLevel()
                );
            }

            csvPrinter.flush();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV", e);
        }
    }

    @Override
    public byte[] generatePDFReport(String reportType, String startDate, String endDate) {
        // TODO: Implement PDF generation using iText or Apache PDFBox
        return "PDF Report Placeholder".getBytes();
    }

    // ==================== VEHICLE UTILIZATION ====================

    @Override
    public List<Map<String, Object>> getVehicleUtilization() {
        List<Vehicle> vehicles = vehicleRepository.findAll();

        return vehicles.stream()
                .map(v -> {
                    Map<String, Object> util = new HashMap<>();
                    util.put("vehicleId", v.getId());
                    util.put("name", v.getName());
                    util.put("type", v.getType().getName());
                    // Mock utilization - replace with actual trip history calculation
                    util.put("utilizationRate", Math.random() * 100);
                    util.put("totalTrips", (int)(Math.random() * 50));
                    return util;
                })
                .collect(Collectors.toList());
    }

    // ==================== REVENUE TRENDS ====================

    @Override
    public Map<String, Object> getRevenueTrends(int days) {
        Map<String, Object> trends = new HashMap<>();
        List<Map<String, Object>> dailyRevenue = new ArrayList<>();

        // Mock data - replace with actual booking/payment data
        for (int i = days - 1; i >= 0; i--) {
            Map<String, Object> day = new HashMap<>();
            day.put("date", LocalDate.now().minusDays(i));
            day.put("revenue", Math.random() * 5000);
            dailyRevenue.add(day);
        }

        trends.put("daily", dailyRevenue);
        trends.put("total", dailyRevenue.stream()
                .mapToDouble(d -> (Double) d.get("revenue"))
                .sum());

        return trends;
    }
}

