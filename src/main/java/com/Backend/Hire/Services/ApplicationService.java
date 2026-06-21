package com.Backend.Hire.Services;

import com.Backend.Hire.DTOs.ApplicationReq;
import com.Backend.Hire.DTOs.ApplicationRes;
import com.Backend.Hire.Models.ApplicationStatus;
import com.Backend.Hire.Models.Applications;
import com.Backend.Hire.Models.Job;
import com.Backend.Hire.Models.User;
import com.Backend.Hire.Repositories.ApplicationRepo;
import com.Backend.Hire.Repositories.JobRepo;
import com.Backend.Hire.Repositories.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepo applicationRepository;
    private final JobRepo jobRepository;
    private final UserRepo userRepository;

    // ── User: apply for a job ────────────────────────────────
    @Transactional
    public ApplicationRes applyForJob(ApplicationReq request,
                                           String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found"));

        // prevent duplicate application
        if (applicationRepository.existsByUserAndJob(user, job)) {
            throw new RuntimeException("You have already applied for this job");
        }

        Applications application = Applications.builder()
                .user(user)
                .job(job)
                .status(ApplicationStatus.PENDING)
                .resumeUrl(request.getResumeUrl())
                .coverLetter(request.getCoverLetter())
                .build();

        return mapToResponse(applicationRepository.save(application));
    }

    // ── User: get my applications ────────────────────────────
    @Transactional
    public List<ApplicationRes> getMyApplications(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return applicationRepository.findByUser(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Admin: get all applications for a job ────────────────
    @Transactional
    public List<ApplicationRes> getApplicationsForJob(Long jobId,
                                                           String adminEmail) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        // make sure admin owns this job
        if (!job.getPostedBy().getEmail().equals(adminEmail)) {
            throw new RuntimeException("Not authorized to view these applications");
        }

        return applicationRepository.findByJob(job)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Admin: update application status ────────────────────
    @Transactional
    public ApplicationRes updateStatus(Long applicationId,
                                            String status,
                                            String adminEmail) {
        Applications application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // make sure admin owns the job this application belongs to
        if (!application.getJob().getPostedBy().getEmail().equals(adminEmail)) {
            throw new RuntimeException("Not authorized to update this application");
        }

        // convert string to enum safely
        try {
            application.setStatus(ApplicationStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(
                    "Invalid status. Use: PENDING, REVIEWED, ACCEPTED, REJECTED"
            );
        }

        return mapToResponse(applicationRepository.save(application));
    }

    // ── Private: entity → DTO ────────────────────────────────
    private ApplicationRes mapToResponse(Applications app) {
        return ApplicationRes.builder()
                .id(app.getId())
                .jobId(app.getJob().getId())
                .jobTitle(app.getJob().getTitle())
                .company(app.getJob().getCompany())
                .userId(app.getUser().getId())
                .applicantName(app.getUser().getName())
                .applicantEmail(app.getUser().getEmail())
                .status(app.getStatus())
                .resumeUrl(app.getResumeUrl())
                .coverLetter(app.getCoverLetter())
                .appliedAt(app.getAppliedAt())
                .build();
    }
}
