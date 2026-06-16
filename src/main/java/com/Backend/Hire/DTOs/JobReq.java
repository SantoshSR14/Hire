package com.Backend.Hire.DTOs;

import com.Backend.Hire.Models.JobType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class JobReq {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Company is required")
    private String company;

    @NotBlank(message = "Domain is required")
    private String domain;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Job type is required")
    private JobType type;  // JOB or INTERNSHIP

    private LocalDate deadline;

    @NotBlank(message = "Description is required")
    private String description;
}