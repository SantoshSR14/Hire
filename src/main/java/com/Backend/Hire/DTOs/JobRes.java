package com.Backend.Hire.DTOs;

import com.Backend.Hire.Models.JobType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class JobRes {

    private Long id;
    private String title;
    private String company;
    private String domain;
    private String location;
    private JobType type;
    private LocalDate deadline;
    private String description;
    private String postedByName;  // admin's name — not the whole User object
    private LocalDateTime createdAt;
}