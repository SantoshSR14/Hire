package com.Backend.Hire.Controllers;

import com.Backend.Hire.DTOs.ApplicationRes;
import com.Backend.Hire.DTOs.JobReq;
import com.Backend.Hire.DTOs.JobRes;
import com.Backend.Hire.Services.ApplicationService;
import com.Backend.Hire.Services.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final JobService jobService;
    private final ApplicationService applicationService;

    // ── Job management ───────────────────────────────────────

    // POST /api/admin/jobs — post a new job
    @PostMapping("/jobs")
    public ResponseEntity<JobRes> createJob(
            @Valid @RequestBody JobReq request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                jobService.createJob(request, userDetails.getUsername()));
    }

    // GET /api/admin/jobs — get all jobs posted by this admin
    @GetMapping("/jobs")
    public ResponseEntity<List<JobRes>> getMyJobs(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                jobService.getJobsByAdmin(userDetails.getUsername()));
    }

    // PUT /api/admin/jobs/1 — update a job
    @PutMapping("/jobs/{id}")
    public ResponseEntity<JobRes> updateJob(
            @PathVariable Long id,
            @Valid @RequestBody JobReq request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                jobService.updateJob(id, request, userDetails.getUsername()));
    }

    // DELETE /api/admin/jobs/1 — delete a job
    @DeleteMapping("/jobs/{id}")
    public ResponseEntity<String> deleteJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        jobService.deleteJob(id, userDetails.getUsername());
        return ResponseEntity.ok("Job deleted successfully");
    }

    // ── Application management ───────────────────────────────

    // GET /api/admin/jobs/1/applications — view applicants for a job
    @GetMapping("/jobs/{jobId}/applications")
    public ResponseEntity<List<ApplicationRes>> getApplicationsForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                applicationService.getApplicationsForJob(
                        jobId, userDetails.getUsername()));
    }

    // PUT /api/admin/applications/1/status?status=ACCEPTED
    @PutMapping("/applications/{id}/status")
    public ResponseEntity<ApplicationRes> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                applicationService.updateStatus(
                        id, status, userDetails.getUsername()));
    }
}