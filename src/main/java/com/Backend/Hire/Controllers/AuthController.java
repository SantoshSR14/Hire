package com.Backend.Hire.Controllers;

import com.Backend.Hire.DTOs.AuthRes;
import com.Backend.Hire.DTOs.LoginReq;
import com.Backend.Hire.DTOs.RegisterReq;
import com.Backend.Hire.Services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthRes> register(
            @Valid @RequestBody RegisterReq request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthRes> login(
            @Valid @RequestBody LoginReq request) {
        return ResponseEntity.ok(authService.login(request));
    }
}