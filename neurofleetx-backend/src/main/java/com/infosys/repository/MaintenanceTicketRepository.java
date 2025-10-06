package com.infosys.repository;

import com.infosys.model.MaintenanceTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByStatus(String status);
    List<MaintenanceTicket> findByReportedById(Long userId);
}
