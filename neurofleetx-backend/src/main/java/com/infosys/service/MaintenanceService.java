package com.infosys.service;


import com.infosys.model.MaintenanceTicket;

import java.util.List;

public interface MaintenanceService {
    MaintenanceTicket createTicket(Long vehicleId, Long reporterId, String desc, String severity);
    List<MaintenanceTicket> listAll();
    List<MaintenanceTicket> listByReporter(Long reporterId);
    MaintenanceTicket updateStatus(Long ticketId, String status);
}
