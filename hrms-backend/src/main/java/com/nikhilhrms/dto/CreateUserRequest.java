package com.nikhilhrms.dto;

import com.nikhilhrms.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new user by SUPER_ADMIN
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {
    private String email;
    private String firstName;
    private String lastName;
    private User.Role role;
    private Long departmentId;
    private String designation;
    private Long reportingManagerId;
    private String employeeType; // FULL_TIME, INTERN, CONTRACT
    private Long shiftId; // Optional shift assignment
    private Boolean isActive = true;
}
