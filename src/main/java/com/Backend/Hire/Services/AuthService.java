package com.Backend.Hire.Services;

import com.Backend.Hire.DTOs.AuthRes;
import com.Backend.Hire.DTOs.LoginReq;
import com.Backend.Hire.DTOs.RegisterReq;
import com.Backend.Hire.Models.Role;
import com.Backend.Hire.Models.User;
import com.Backend.Hire.Repositories.UserRepo;
import com.Backend.Hire.Security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepo userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    // ── Register ─────────────────────────────────────────────
    public AuthRes register(RegisterReq request) {

        // check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // determine role — default to USER if not provided
        Role role = Role.USER;
        if (request.getRole() != null &&
                request.getRole().equalsIgnoreCase("ADMIN")) {
            role = Role.ADMIN;
        }

        // build and save user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);

        // generate JWT token
        String token = jwtUtil.generateToken(user.getEmail());

        return AuthRes.builder()
                .token(token)
                .role(user.getRole().name())
                .name(user.getName())
                .userId(user.getId())
                .build();
    }

    // ── Login ────────────────────────────────────────────────
    public AuthRes login(LoginReq request) {

        // authenticate — throws exception if wrong credentials
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // if we reach here, credentials are correct
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthRes.builder()
                .token(token)
                .role(user.getRole().name())
                .name(user.getName())
                .userId(user.getId())
                .build();
    }
}