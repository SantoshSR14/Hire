package com.Backend.Hire.DTOs;

import com.Backend.Hire.Models.ApplicationStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ApplicationRes {

    private Long id;

    // job info — shown on user tracking page
    private Long jobId;
    private String jobTitle;
    private String company;

    // applicant info — shown on admin drill-down
    private Long userId;
    private String applicantName;
    private String applicantEmail;

    private ApplicationStatus status;   // PENDING / REVIEWED / ACCEPTED / REJECTED
    private String resumeUrl;
    private String coverLetter;
    private LocalDateTime appliedAt;
}