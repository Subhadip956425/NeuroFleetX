package com.infosys.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/*
  Purpose: Provide a RestTemplate bean so services can call external APIs (Python microservice).
*/
@Configuration
public class AppConfig {

    @Bean
    @Primary
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(30))
                .build();
    }

    /**
     * ML Service RestTemplate for Python Flask AI microservice
     * Timeouts: 15s connect, 60s read (longer for ML model predictions)
     *
     * Used by: MLPredictionService, AnalyticsService
     * Injection: @Qualifier("mlServiceRestTemplate")
     */
    @Bean(name = "mlServiceRestTemplate")
    public RestTemplate mlServiceRestTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(15))
                .readTimeout(Duration.ofSeconds(60))
                .build();
    }
}
