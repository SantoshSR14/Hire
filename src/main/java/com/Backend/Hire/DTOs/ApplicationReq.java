package com.Backend.Hire.DTOs;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplicationReq {

    @NotNull(message = "Job ID is required")
    private Long jobId;

    private String resumeUrl;     // link to resume (Google Drive, etc.)

    private String coverLetter;   // optional text
}