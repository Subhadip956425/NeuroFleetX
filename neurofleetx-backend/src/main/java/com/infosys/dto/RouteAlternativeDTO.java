package com.infosys.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteAlternativeDTO {

    @JsonProperty("name")
    private String name;

    @JsonProperty("eta_minutes")
    private Double eta_minutes;

    @JsonProperty("color")
    private String color;

    @JsonProperty("distance_km")
    private Double distance_km;

    @JsonProperty("traffic_level")
    private Double traffic_level;

    @JsonProperty("description")
    private String description;
}
