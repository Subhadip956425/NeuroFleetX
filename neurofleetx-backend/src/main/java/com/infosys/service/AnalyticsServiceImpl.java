package com.infosys.service;

import com.infosys.model.Booking.Booking;
import com.infosys.model.Vehicle;
import com.infosys.repository.BookingRepository;
import com.infosys.repository.VehicleRepository;
import com.itextpdf.layout.element.Table;
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

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;

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

    // ==================== TRIP HEATMAP DATA (UPDATED) ====================

    @Override
    public List<Map<String, Object>> getTripHeatmapData(String startDate, String endDate) {
        // Parse date range
        LocalDateTime start = startDate != null
                ? LocalDate.parse(startDate).atStartOfDay()
                : LocalDateTime.now().minusDays(7);
        LocalDateTime end = endDate != null
                ? LocalDate.parse(endDate).atTime(23, 59, 59)
                : LocalDateTime.now();

        // Get all bookings in date range
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingDate() != null)
                .filter(b -> !b.getBookingDate().isBefore(start) && !b.getBookingDate().isAfter(end))
                .collect(Collectors.toList());

        // Map to track trip density by location
        Map<String, LocationData> locationMap = new HashMap<>();

        for (Booking booking : bookings) {
            // Process PICKUP location
            if (booking.getPickupLat() != null && booking.getPickupLng() != null) {
                String pickupKey = generateLocationKey(booking.getPickupLat(), booking.getPickupLng());
                locationMap.computeIfAbsent(pickupKey, k -> new LocationData(
                        booking.getPickupLat(),
                        booking.getPickupLng(),
                        booking.getPickupLocation()
                )).incrementPickup();
            }

            // Process DROPOFF location
            if (booking.getDropoffLat() != null && booking.getDropoffLng() != null) {
                String dropoffKey = generateLocationKey(booking.getDropoffLat(), booking.getDropoffLng());
                locationMap.computeIfAbsent(dropoffKey, k -> new LocationData(
                        booking.getDropoffLat(),
                        booking.getDropoffLng(),
                        booking.getDropoffLocation()
                )).incrementDropoff();
            }
        }

        // Convert to list and sort by trip density (highest first)
        return locationMap.values().stream()
                .map(LocationData::toMap)
                .sorted((a, b) -> Integer.compare(
                        (Integer) b.get("tripCount"),
                        (Integer) a.get("tripCount")
                ))
                .collect(Collectors.toList());
    }

    /**
     * Generate location key by rounding coordinates to group nearby trips
     * (3 decimal places = ~111 meters precision)
     */
    private String generateLocationKey(Double lat, Double lng) {
        if (lat == null || lng == null) {
            return "unknown-" + UUID.randomUUID();
        }
        // Round to 3 decimal places to cluster nearby locations
        double roundedLat = Math.round(lat * 1000.0) / 1000.0;
        double roundedLng = Math.round(lng * 1000.0) / 1000.0;
        return roundedLat + "," + roundedLng;
    }

    /**
     * Inner class to aggregate trip data by location
     */
    private static class LocationData {
        private final Double lat;
        private final Double lng;
        private final String locationName;
        private int pickupCount = 0;
        private int dropoffCount = 0;

        public LocationData(Double lat, Double lng, String locationName) {
            this.lat = lat;
            this.lng = lng;
            this.locationName = locationName != null ? locationName : "Unknown Location";
        }

        public void incrementPickup() {
            pickupCount++;
        }

        public void incrementDropoff() {
            dropoffCount++;
        }

        public int getTotalTrips() {
            return pickupCount + dropoffCount;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("lat", lat);
            map.put("lng", lng);
            map.put("locationName", locationName);
            map.put("pickupCount", pickupCount);
            map.put("dropoffCount", dropoffCount);
            map.put("tripCount", getTotalTrips());
            return map;
        }
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

    // ==================== CSV/PDF GENERATION ====================

    @Override
    public byte[] generateCSVReport(String reportType, String startDate, String endDate) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(baos);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT)) {

            switch (reportType) {
                case "fleet-summary":
                    csvPrinter.printRecord("ID", "Name", "Type", "Status", "Battery", "Fuel");
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
                    break;

                case "bookings":
                    csvPrinter.printRecord("Booking ID", "Customer ID", "Vehicle ID", "Pickup Location", "Dropoff Location", "Status", "Start Time");
                    List<Booking> bookings = bookingRepository.findAll().stream()
                            .filter(b -> {
                                LocalDateTime start = startDate != null ? LocalDate.parse(startDate).atStartOfDay() : null;
                                LocalDateTime end = endDate != null ? LocalDate.parse(endDate).atTime(23,59,59) : null;
                                if (start != null && b.getStartTime() != null && b.getStartTime().isBefore(start)) return false;
                                if (end != null && b.getStartTime() != null && b.getStartTime().isAfter(end)) return false;
                                return true;
                            })
                            .collect(Collectors.toList());
                    for (Booking b : bookings) {
                        csvPrinter.printRecord(
                                b.getId(),
                                b.getCustomerId(),
                                b.getVehicleId(),
                                b.getPickupLocation(),
                                b.getDropoffLocation(),
                                b.getStatus(),
                                b.getStartTime() != null ? b.getStartTime().toString() : ""
                        );
                    }
                    break;

                case "revenue":
                    csvPrinter.printRecord("Date", "Revenue");
                    for (int i = 0; i < 7; i++) {
                        csvPrinter.printRecord(
                                LocalDate.now().minusDays(i).toString(),
                                String.format("%.2f", Math.random() * 5000)
                        );
                    }
                    break;

                case "maintenance":
                    csvPrinter.printRecord("Vehicle ID", "Name", "Battery Level", "Fuel Level", "Health Status");
                    List<Vehicle> maintenanceVehicles = vehicleRepository.findAll();
                    for (Vehicle v : maintenanceVehicles) {
                        String healthStatus = "Healthy";
                        csvPrinter.printRecord(
                                v.getId(),
                                v.getName(),
                                v.getBatteryLevel(),
                                v.getFuelLevel(),
                                healthStatus
                        );
                    }
                    break;

                case "utilization":
                    csvPrinter.printRecord("Vehicle ID", "Name", "Type", "Utilization Rate", "Total Trips");
                    List<Vehicle> utilVehicles = vehicleRepository.findAll();
                    for (Vehicle v : utilVehicles) {
                        double utilizationRate = Math.random() * 100;
                        int totalTrips = (int)(Math.random() * 50);
                        csvPrinter.printRecord(
                                v.getId(),
                                v.getName(),
                                v.getType().getName(),
                                String.format("%.2f%%", utilizationRate),
                                totalTrips
                        );
                    }
                    break;

                case "heatmap":
                    // NEW: Trip heatmap CSV export
                    csvPrinter.printRecord("Latitude", "Longitude", "Location Name", "Pickup Count", "Dropoff Count", "Total Trips");
                    List<Map<String, Object>> heatmapData = getTripHeatmapData(startDate, endDate);
                    for (Map<String, Object> location : heatmapData) {
                        csvPrinter.printRecord(
                                location.get("lat"),
                                location.get("lng"),
                                location.get("locationName"),
                                location.get("pickupCount"),
                                location.get("dropoffCount"),
                                location.get("tripCount")
                        );
                    }
                    break;

                default:
                    csvPrinter.printRecord("Invalid report type");
            }

            csvPrinter.flush();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV", e);
        }
    }

    @Override
    public byte[] generatePDFReport(String reportType, String startDate, String endDate) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("NeuroFleetX - " + reportType.toUpperCase() + " Report").setBold().setFontSize(18));
            document.add(new Paragraph("Date Range: " +
                    (startDate != null ? startDate : "All Time") + " to " +
                    (endDate != null ? endDate : "Now")));
            document.add(new Paragraph("\n"));

            switch (reportType) {
                case "fleet-summary":
                    addFleetSummaryPDF(document);
                    break;

                case "bookings":
                    addBookingsPDF(document, startDate, endDate);
                    break;

                case "revenue":
                    addRevenuePDF(document, startDate, endDate);
                    break;

                case "maintenance":
                    addMaintenancePDF(document);
                    break;

                case "utilization":
                    addUtilizationPDF(document);
                    break;

                case "heatmap":
                    addHeatmapPDF(document, startDate, endDate);
                    break;

                default:
                    document.add(new Paragraph("Invalid report type"));
                    break;
            }

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    // ==================== PDF HELPER METHODS ====================

    private void addFleetSummaryPDF(Document document) {
        float[] columnWidths = {50f, 150f, 100f, 100f, 60f, 60f};
        com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(columnWidths);

        table.addHeaderCell("ID");
        table.addHeaderCell("Name");
        table.addHeaderCell("Type");
        table.addHeaderCell("Status");
        table.addHeaderCell("Battery");
        table.addHeaderCell("Fuel");

        List<Vehicle> vehicles = vehicleRepository.findAll();
        for (Vehicle v : vehicles) {
            table.addCell(String.valueOf(v.getId()));
            table.addCell(v.getName());
            table.addCell(v.getType().getName());
            table.addCell(v.getStatus().getName());
            table.addCell(v.getBatteryLevel() != null ? v.getBatteryLevel() + "%" : "N/A");
            table.addCell(v.getFuelLevel() != null ? v.getFuelLevel() + "%" : "N/A");
        }
        document.add(table);
    }

    private void addBookingsPDF(Document document, String startDate, String endDate) {
        float[] columnWidths = {50f, 70f, 70f, 120f, 120f, 60f, 90f};
        Table table = new Table(columnWidths);

        table.addHeaderCell("Booking ID");
        table.addHeaderCell("Customer ID");
        table.addHeaderCell("Vehicle ID");
        table.addHeaderCell("Pickup Location");
        table.addHeaderCell("Dropoff Location");
        table.addHeaderCell("Status");
        table.addHeaderCell("Start Time");

        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> {
                    LocalDateTime start = startDate != null ? LocalDate.parse(startDate).atStartOfDay() : null;
                    LocalDateTime end = endDate != null ? LocalDate.parse(endDate).atTime(23, 59, 59) : null;
                    if (b.getStartTime() == null) return false;
                    if (start != null && b.getStartTime().isBefore(start)) return false;
                    if (end != null && b.getStartTime().isAfter(end)) return false;
                    return true;
                })
                .collect(Collectors.toList());

        for (Booking b : bookings) {
            table.addCell(String.valueOf(b.getId()));
            table.addCell(String.valueOf(b.getCustomerId()));
            table.addCell(b.getVehicleId() != null ? String.valueOf(b.getVehicleId()) : "N/A");
            table.addCell(sanitizeString(b.getPickupLocation(), 30));
            table.addCell(sanitizeString(b.getDropoffLocation(), 30));
            table.addCell(b.getStatus() != null ? b.getStatus().toString() : "N/A");
            table.addCell(b.getStartTime() != null ? b.getStartTime().toString() : "N/A");
        }
        document.add(table);
    }

    private void addRevenuePDF(Document document, String startDate, String endDate) {
        float[] columnWidths = {100f, 150f};
        com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(columnWidths);

        table.addHeaderCell("Date");
        table.addHeaderCell("Revenue");

        for (int i = 0; i < 7; i++) {
            LocalDate date = LocalDate.now().minusDays(i);
            table.addCell(date.toString());
            table.addCell(String.format("$%.2f", Math.random() * 5000));
        }
        document.add(table);
    }

    private void addMaintenancePDF(Document document) {
        float[] columnWidths = {50f, 150f, 70f, 70f, 100f};
        com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(columnWidths);

        table.addHeaderCell("Vehicle ID");
        table.addHeaderCell("Name");
        table.addHeaderCell("Battery Level");
        table.addHeaderCell("Fuel Level");
        table.addHeaderCell("Health Status");

        List<Vehicle> vehicles = vehicleRepository.findAll();
        for (Vehicle v : vehicles) {
            String healthStatus = "Healthy";
            table.addCell(String.valueOf(v.getId()));
            table.addCell(v.getName());
            table.addCell(v.getBatteryLevel() != null ? v.getBatteryLevel() + "%" : "N/A");
            table.addCell(v.getFuelLevel() != null ? v.getFuelLevel() + "%" : "N/A");
            table.addCell(healthStatus);
        }
        document.add(table);
    }

    private void addUtilizationPDF(Document document) {
        float[] columnWidths = {50f, 150f, 100f, 100f, 100f};
        com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(columnWidths);

        table.addHeaderCell("Vehicle ID");
        table.addHeaderCell("Name");
        table.addHeaderCell("Type");
        table.addHeaderCell("Utilization Rate");
        table.addHeaderCell("Total Trips");

        List<Vehicle> vehicles = vehicleRepository.findAll();
        Random random = new Random();
        for (Vehicle v : vehicles) {
            table.addCell(String.valueOf(v.getId()));
            table.addCell(v.getName());
            table.addCell(v.getType().getName());
            table.addCell(String.format("%.2f%%", random.nextDouble() * 100));
            table.addCell(String.valueOf(random.nextInt(50)));
        }
        document.add(table);
    }

    /**
     * NEW: Add Trip Heatmap PDF report
     */
    private void addHeatmapPDF(Document document, String startDate, String endDate) {
        float[] columnWidths = {70f, 70f, 150f, 70f, 70f, 70f};
        com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(columnWidths);

        table.addHeaderCell("Latitude");
        table.addHeaderCell("Longitude");
        table.addHeaderCell("Location Name");
        table.addHeaderCell("Pickups");
        table.addHeaderCell("Dropoffs");
        table.addHeaderCell("Total Trips");

        List<Map<String, Object>> heatmapData = getTripHeatmapData(startDate, endDate);
        for (Map<String, Object> location : heatmapData) {
            table.addCell(String.valueOf(location.get("lat")));
            table.addCell(String.valueOf(location.get("lng")));
            table.addCell(sanitizeString((String) location.get("locationName"), 40));
            table.addCell(String.valueOf(location.get("pickupCount")));
            table.addCell(String.valueOf(location.get("dropoffCount")));
            table.addCell(String.valueOf(location.get("tripCount")));
        }
        document.add(table);
    }

    private String sanitizeString(String input, int maxLength) {
        if (input == null) return "N/A";
        return input.length() > maxLength ? input.substring(0, maxLength - 3) + "..." : input;
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
