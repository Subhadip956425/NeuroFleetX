package com.infosys.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        // ✅ Use builder for proper configuration
        ObjectMapper mapper = Jackson2ObjectMapperBuilder.json()
                .modules(
                        // ✅ Handle Java 8 LocalDateTime
                        new JavaTimeModule(),
                        // ✅ Handle Hibernate lazy loading
                        new Hibernate6Module()
                )
                .serializationInclusion(JsonInclude.Include.NON_NULL)
                .featuresToDisable(
                        // ✅ Write dates as strings, not timestamps
                        SerializationFeature.WRITE_DATES_AS_TIMESTAMPS
                )
                .build();

        return mapper;
    }
}
