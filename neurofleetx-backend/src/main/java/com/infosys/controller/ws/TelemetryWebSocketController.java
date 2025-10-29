package com.infosys.controller.ws;

import com.infosys.model.VehicleTelemetry;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class TelemetryWebSocketController {

    @MessageMapping("/telemetry")
    @SendTo("/topic/telemetry")
    public VehicleTelemetry broadcastTelemetry(VehicleTelemetry telemetry) {
        return telemetry;
    }
}

