package com.infosys.service.Health_Analytics;


import com.infosys.model.Health_Analytics.MaintenanceTicket;

import java.util.List;

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
}
