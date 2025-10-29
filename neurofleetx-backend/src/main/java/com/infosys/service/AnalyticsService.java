package com.infosys.service;

import java.util.List;
import java.util.Map;

public interface AnalyticsService {

    // Fleet Distribution
    Map<String, Object> getFleetDistribution();

    // Trip Heatmap Data
    List<Map<String, Object>> getTripHeatmapData(String startDate, String endDate);

    // KPI Summary
    Map<String, Object> getKPISummary();

    // Hourly Rental Activity
    List<Map<String, Object>> getHourlyRentalActivity(String dateStr);

    // CSV/PDF Report Generation
    byte[] generateCSVReport(String reportType, String startDate, String endDate);
    byte[] generatePDFReport(String reportType, String startDate, String endDate);

    // Vehicle Utilization
    List<Map<String, Object>> getVehicleUtilization();

    // Revenue Trends
    Map<String, Object> getRevenueTrends(int days);
}
