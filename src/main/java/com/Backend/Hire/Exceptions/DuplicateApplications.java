package com.Backend.Hire.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateApplications extends RuntimeException {

    public DuplicateApplications(String message) {
        super(message);
    }
}