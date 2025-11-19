package com.infosys.controller.Health_Analytics;

import com.infosys.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    // ==================== REAL-TIME FLEET DISTRIBUTION ====================

    @GetMapping("/fleet-distribution")
    public ResponseEntity<Map<String, Object>> getFleetDistribution() {
        return ResponseEntity.ok(analyticsService.getFleetDistribution());
    }

    // ==================== TRIP DENSITY HEATMAP DATA ====================

    @GetMapping("/trip-heatmap")
    public ResponseEntity<List<Map<String, Object>>> getTripHeatmap(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(analyticsService.getTripHeatmapData(startDate, endDate));
    }

    // ==================== KPI DASHBOARD DATA ====================

    @GetMapping("/kpi-summary")
    public ResponseEntity<Map<String, Object>> getKPISummary() {
        return ResponseEntity.ok(analyticsService.getKPISummary());
    }

    // ==================== HOURLY RENTAL ACTIVITY ====================

    @GetMapping("/hourly-activity")
    public ResponseEntity<List<Map<String, Object>>> getHourlyActivity(
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(analyticsService.getHourlyRentalActivity(date));
    }

    // ==================== EXPORT REPORTS ====================

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCSV(
            @RequestParam String reportType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        byte[] csvData = analyticsService.generateCSVReport(reportType, startDate, endDate);

        String filename = String.format("%s-%s-%s.csv", reportType,
                startDate != null ? startDate : "start",
                endDate != null ? endDate : "end");

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Type", "text/csv; charset=UTF-8")
                .body(csvData);
    }


    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPDF(
            @RequestParam String reportType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        try {
            byte[] pdfData = analyticsService.generatePDFReport(reportType, startDate, endDate);
            String filename = String.format("%s-%s-%s.pdf", reportType,
                    startDate != null ? startDate : "start",
                    endDate != null ? endDate : "end");

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .header("Content-Type", "application/pdf")
                    .body(pdfData);
        } catch (Exception e) {
            // Log full stack trace here or send error message in response headers/body if appropriate
            System.err.println("PDF export failed: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .header("Content-Type", "application/json")
                    .body(("{\"error\":\"" + e.getMessage() + "\"}").getBytes());
        }
    }



    // ==================== ADDITIONAL INSIGHTS ====================

    @GetMapping("/vehicle-utilization")
    public ResponseEntity<List<Map<String, Object>>> getVehicleUtilization() {
        return ResponseEntity.ok(analyticsService.getVehicleUtilization());
    }

    @GetMapping("/revenue-trends")
    public ResponseEntity<Map<String, Object>> getRevenueTrends(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(analyticsService.getRevenueTrends(days));
    }
}
