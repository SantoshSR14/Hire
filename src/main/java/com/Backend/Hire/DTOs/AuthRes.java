package com.Backend.Hire.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class AuthRes {

    private String token;   // JWT token — stored in React localStorage
    private String role;    // "USER" or "ADMIN" — React uses this for routing
    private String name;    // display name for navbar/profile
    private Long userId;    // needed for frontend to reference the logged-in user
}