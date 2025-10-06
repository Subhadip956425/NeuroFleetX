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
        // Frontend connects here
        registry.addEndpoint("/ws-telemetry")
                .addInterceptors(authHandshakeInterceptor)
                .setAllowedOriginPatterns("*") // or specify your frontend origin
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for sending messages from server to client
        registry.enableSimpleBroker("/topic");
        // Prefix for messages sent from client to server (optional)
        registry.setApplicationDestinationPrefixes("/app");
    }
}
