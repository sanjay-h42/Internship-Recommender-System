package com.internship.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistoryResponse {
    private Long id;
    private String query;
    private String location;
    private String skills;
    private String sector;
    private String searchMode;
    private String mode;
    private String salaryMin;
    private LocalDateTime timestamp;
}
