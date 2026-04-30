package com.tanvox.hrms.identity.dto;

import com.tanvox.hrms.common.dto.BaseDTO;
import com.tanvox.hrms.identity.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * User DTO for API responses and requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO extends BaseDTO {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String profilePicture;
    private User.UserStatus status;
    private Long employeeId;
    private Boolean isLocked;
    private Boolean isPasswordChangeRequired;
    private Boolean isMfaEnabled;
    private List<RoleDTO> roles;
}
