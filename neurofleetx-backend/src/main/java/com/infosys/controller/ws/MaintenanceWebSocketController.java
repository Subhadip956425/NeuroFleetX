package com.infosys.controller.ws;

import com.infosys.model.Health_Analytics.MaintenanceTicket;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class MaintenanceWebSocketController {

    @MessageMapping("/maintenance")
    @SendTo("/topic/maintenance")
    public MaintenanceTicket broadcastMaintenanceUpdate(MaintenanceTicket ticket) {
        return ticket;
    }
}

