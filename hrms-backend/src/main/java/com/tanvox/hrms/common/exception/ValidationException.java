package com.tanvox.hrms.common.exception;

import java.util.List;

/**
 * Exception thrown when validation fails.
 */
public class ValidationException extends RuntimeException {
    private List<String> errors;

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String message, List<String> errors) {
        super(message);
        this.errors = errors;
    }

    public List<String> getErrors() {
        return errors;
    }
}
