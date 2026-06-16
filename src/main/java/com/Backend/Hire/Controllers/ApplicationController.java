package com.Backend.Hire.Controllers;

import com.Backend.Hire.DTOs.ApplicationReq;
import com.Backend.Hire.DTOs.ApplicationRes;
import com.Backend.Hire.Services.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    // POST /api/applications — user applies for a job
    @PostMapping
    public ResponseEntity<ApplicationRes> apply(
            @Valid @RequestBody ApplicationReq request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                applicationService.applyForJob(
                        request, userDetails.getUsername()));
    }

    // GET /api/applications/me — user's own applications
    @GetMapping("/me")
    public ResponseEntity<List<ApplicationRes>> getMyApplications(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                applicationService.getMyApplications(
                        userDetails.getUsername()));
    }
}