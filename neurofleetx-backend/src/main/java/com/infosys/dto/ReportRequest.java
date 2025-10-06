package com.infosys.dto;

import lombok.Data;

@Data
public class ReportRequest {
        public Long vehicleId;
        public String description;
        public String severity;
    }