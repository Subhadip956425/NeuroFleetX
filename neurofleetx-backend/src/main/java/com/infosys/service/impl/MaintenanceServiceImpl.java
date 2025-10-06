package com.infosys.service.impl;

import com.infosys.model.MaintenanceTicket;
import com.infosys.model.User;
import com.infosys.model.Vehicle;
import com.infosys.repository.MaintenanceTicketRepository;
import com.infosys.repository.UserRepository;
import com.infosys.repository.VehicleRepository;
import com.infosys.service.MaintenanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MaintenanceServiceImpl implements MaintenanceService {

    @Autowired
    private MaintenanceTicketRepository ticketRepo;
    @Autowired
    private VehicleRepository vehicleRepo;
    @Autowired
    private UserRepository userRepo;

    @Override
    public MaintenanceTicket createTicket(Long vehicleId, Long reporterId, String desc, String severity) {
        Vehicle v = vehicleRepo.findById(vehicleId).orElseThrow(() -> new RuntimeException("Vehicle not found"));
        User u = userRepo.findById(reporterId).orElseThrow(() -> new RuntimeException("Reporter not found"));

        MaintenanceTicket t = new MaintenanceTicket();
        t.setVehicle(v);
        t.setReportedBy(u);
        t.setDescription(desc);
        t.setSeverity(severity);
        t.setStatus("OPEN");
        t.setCreatedAt(LocalDateTime.now());
        return ticketRepo.save(t);
    }

    @Override
    public List<MaintenanceTicket> listAll() {
        return ticketRepo.findAll();
    }

    @Override
    public List<MaintenanceTicket> listByReporter(Long reporterId) {
        return ticketRepo.findByReportedById(reporterId);
    }

    @Override
    public MaintenanceTicket updateStatus(Long ticketId, String status) {
        MaintenanceTicket t = ticketRepo.findById(ticketId).orElseThrow(() -> new RuntimeException("Ticket not found"));
        t.setStatus(status);
        return ticketRepo.save(t);
    }
}
