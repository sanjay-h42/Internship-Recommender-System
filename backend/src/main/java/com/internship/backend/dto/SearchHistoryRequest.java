package com.internship.backend.dto;

import lombok.Data;

@Data
public class SearchHistoryRequest {
    private String query;
    private String location;
    private String skills;
    private String sector;
    private String searchMode;
    private String mode;
    private String salaryMin;
}
