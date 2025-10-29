package com.infosys.config;

import com.infosys.security.ws.AuthHandshakeInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private AuthHandshakeInterceptor authHandshakeInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Telemetry WebSocket (existing)
        registry.addEndpoint("/ws-telemetry")
                .addInterceptors(authHandshakeInterceptor)
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // ✅ ADD: Maintenance WebSocket (new)
        registry.addEndpoint("/ws-maintenance")
                .addInterceptors(authHandshakeInterceptor)
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // ✅ ADD: General WebSocket endpoint
        registry.addEndpoint("/ws")
                .addInterceptors(authHandshakeInterceptor)
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for sending messages from server to client
        registry.enableSimpleBroker("/topic", "/queue"); // Added /queue
        // Prefix for messages sent from client to server
        registry.setApplicationDestinationPrefixes("/app");
    }
}
