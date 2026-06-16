package com.Backend.Hire.Controllers;
import com.Backend.Hire.DTOs.JobRes;
import com.Backend.Hire.Services.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // GET /api/jobs?domain=Technology&keyword=react
    @GetMapping
    public ResponseEntity<List<JobRes>> getAllJobs(
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(jobService.getAllJobs(domain, keyword));
    }

    // GET /api/jobs/1
    @GetMapping("/{id}")
    public ResponseEntity<JobRes> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }
}