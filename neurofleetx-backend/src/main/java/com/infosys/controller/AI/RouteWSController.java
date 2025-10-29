// src/main/java/com/neurofleetx/controller/RouteWSController.java
package com.infosys.controller.AI;

import com.infosys.model.AI.Route;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class RouteWSController {

    private final SimpMessagingTemplate messagingTemplate;

    public RouteWSController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Send route update to clients
    public void sendRouteUpdate(Route route) {
        messagingTemplate.convertAndSend("/topic/routes", route);
    }

    // Optional: receive messages from clients
    @MessageMapping("/update-route")
    public void updateRoute(Route route) {
        sendRouteUpdate(route);
    }
}
