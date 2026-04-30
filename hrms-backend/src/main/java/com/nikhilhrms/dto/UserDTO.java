package com.nikhilhrms.dto;

import com.nikhilhrms.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private User.Role role;
    private Boolean isActive;
    private User.AccountStatus accountStatus;
    private Boolean verified;
    private Boolean firstLogin;
    private LocalDateTime lastLogin;
    private Set<String> permissions;
    private String employeeCode;
    private String temporaryPassword;

    public UserDTO(Long id, String email, User.Role role, Boolean isActive) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.isActive = isActive;
    }
}
