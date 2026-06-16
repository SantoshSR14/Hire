package com.Backend.Hire.Services;

import com.Backend.Hire.DTOs.JobReq;
import com.Backend.Hire.DTOs.JobRes;
import com.Backend.Hire.Models.Job;
import com.Backend.Hire.Models.User;
import com.Backend.Hire.Repositories.JobRepo;
import com.Backend.Hire.Repositories.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepo jobRepository;
    private final UserRepo userRepository;

    // ── Admin: post a new job ────────────────────────────────
    public JobRes createJob(JobReq request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Job job = Job.builder()
                .title(request.getTitle())
                .company(request.getCompany())
                .domain(request.getDomain())
                .location(request.getLocation())
                .type(request.getType())
                .deadline(request.getDeadline())
                .description(request.getDescription())
                .postedBy(admin)
                .build();

        return mapToResponse(jobRepository.save(job));
    }

    // ── Public: get all jobs with optional filters ───────────
    public List<JobRes> getAllJobs(String domain, String keyword) {
        List<Job> jobs;

        if (keyword != null && !keyword.isBlank() &&
                domain != null && !domain.isBlank()) {
            jobs = jobRepository.findByDomainAndKeyword(domain, keyword);
        } else if (keyword != null && !keyword.isBlank()) {
            jobs = jobRepository.searchByKeyword(keyword);
        } else if (domain != null && !domain.isBlank()) {
            jobs = jobRepository.findByDomainIgnoreCase(domain);
        } else {
            jobs = jobRepository.findAll();
        }

        return jobs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Public: get single job by id ─────────────────────────
    public JobRes getJobById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        return mapToResponse(job);
    }

    // ── Admin: get jobs posted by this admin ─────────────────
    public List<JobRes> getJobsByAdmin(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return jobRepository.findByPostedBy(admin)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Admin: update a job ──────────────────────────────────
    public JobRes updateJob(Long id, JobReq request, String adminEmail) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));

        // only the admin who posted it can edit it
        if (!job.getPostedBy().getEmail().equals(adminEmail)) {
            throw new RuntimeException("Not authorized to edit this job");
        }

        job.setTitle(request.getTitle());
        job.setCompany(request.getCompany());
        job.setDomain(request.getDomain());
        job.setLocation(request.getLocation());
        job.setType(request.getType());
        job.setDeadline(request.getDeadline());
        job.setDescription(request.getDescription());

        return mapToResponse(jobRepository.save(job));
    }

    // ── Admin: delete a job ──────────────────────────────────
    public void deleteJob(Long id, String adminEmail) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));

        if (!job.getPostedBy().getEmail().equals(adminEmail)) {
            throw new RuntimeException("Not authorized to delete this job");
        }

        jobRepository.delete(job);
    }

    // ── Private: entity → DTO ────────────────────────────────
    public JobRes mapToResponse(Job job) {
        return JobRes.builder()
                .id(job.getId())
                .title(job.getTitle())
                .company(job.getCompany())
                .domain(job.getDomain())
                .location(job.getLocation())
                .type(job.getType())
                .deadline(job.getDeadline())
                .description(job.getDescription())
                .postedByName(job.getPostedBy().getName())
                .createdAt(job.getCreatedAt())
                .build();
    }
}