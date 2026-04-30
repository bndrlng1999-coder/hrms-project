package com.tanvox.hrms.common.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for audit operations.
 */
public class AuditUtil {

    /**
     * Get the current authenticated user's username/email.
     */
    public static String getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "SYSTEM";
    }

    /**
     * Get the client's IP address from request.
     */
    public static String getClientIp() {
        // Implementation will use HttpServletRequest when needed
        return "0.0.0.0";
    }

    /**
     * Get the client's user agent from request.
     */
    public static String getUserAgent() {
        // Implementation will use HttpServletRequest when needed
        return "Unknown";
    }
}
