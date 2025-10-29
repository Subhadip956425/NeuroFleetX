package com.infosys.service;

import com.infosys.model.Health_Analytics.MaintenanceTicket;
import com.infosys.model.VehicleTelemetry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendTelemetryUpdate(VehicleTelemetry telemetry) {
        messagingTemplate.convertAndSend("/topic/telemetry", telemetry);
    }

    public void sendMaintenanceUpdate(MaintenanceTicket ticket) {
        messagingTemplate.convertAndSend("/topic/maintenance", ticket);
    }
}
