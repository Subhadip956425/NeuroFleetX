package com.infosys.service.Health_Analytics;


import com.infosys.model.Health_Analytics.MaintenancePrediction;
import com.infosys.model.Health_Analytics.MaintenanceTicket;

import java.util.List;
import java.util.Map;

public interface MaintenanceService {
    MaintenanceTicket createTicket(Long vehicleId, Long reporterId, String desc, String severity);
    List<MaintenanceTicket> listAll();
    List<MaintenanceTicket> listByReporter(Long reporterId);
    MaintenanceTicket updateStatus(Long ticketId, String status);
    List<MaintenanceTicket> getOpenTickets();
    List<MaintenanceTicket> getTicketsForVehicle(Long vehicleId);
    MaintenanceTicket resolveTicket(Long ticketId);
    void evaluateHealthForVehicle(Long vehicleId);
    MaintenanceTicket createTicket(MaintenanceTicket ticket);

    public List<MaintenanceTicket> getResolvedTickets();

    public List<MaintenanceTicket> getAllTickets();

    // ========== ✅ NEW: AI Prediction Methods ==========
    MaintenancePrediction getLatestPrediction(Long vehicleId);
    List<MaintenancePrediction> getAllPredictions();
    List<MaintenancePrediction> getCriticalPredictions();
    Map<String, Object> getStatistics();

}
