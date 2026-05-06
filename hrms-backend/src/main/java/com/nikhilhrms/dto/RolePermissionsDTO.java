package com.nikhilhrms.dto;

import com.nikhilhrms.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionsDTO {
    private List<User.Role> roles;
    private Set<String> allPermissions;
    private Map<String, Set<String>> permissionsByRole;
}
