package com.infosys.repository.Health_Analytics;

import com.infosys.model.Health_Analytics.MaintenanceTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByStatus(String status);
    List<MaintenanceTicket> findByReportedById(Long userId);
    List<MaintenanceTicket> findByVehicleId(Long vehicleId);

    List<MaintenanceTicket> findByVehicleIdAndStatus(Long vehicleId, String status);

    @Modifying
    @Transactional
    @Query("DELETE FROM MaintenanceTicket m WHERE m.vehicle.id = :vehicleId")
    int deleteByVehicleId(@Param("vehicleId") Long vehicleId);
}
