package com.Backend.Hire.DTOs;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginReq {
    @Email(message="Enter a valid Email")
    @NotBlank(message="This field can't be empty")
    private String email;
    @NotBlank(message="This field can't be empty")
    @Size(min=6, message = "Enter a password of minimum 6 characters")
    private String password;

}
