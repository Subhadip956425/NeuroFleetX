package com.infosys.repository.Health_Analytics;

import com.infosys.model.Health_Analytics.MaintenanceTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByStatus(String status);
    List<MaintenanceTicket> findByReportedById(Long userId);
    List<MaintenanceTicket> findByVehicleId(Long vehicleId);
}
