package com.nikhilhrms.service;

import com.nikhilhrms.dto.RolePermissionsDTO;
import com.nikhilhrms.entity.RolePermission;
import com.nikhilhrms.entity.User;
import com.nikhilhrms.repository.RolePermissionRepository;
import com.nikhilhrms.security.PermissionRegistry;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RolePermissionService {
    private final RolePermissionRepository repository;

    public RolePermissionService(RolePermissionRepository repository) {
        this.repository = repository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaults() {
        for (User.Role role : User.Role.values()) {
            if (!repository.existsByRoleName(role.name())) {
                saveRolePermissions(role, PermissionRegistry.defaultPermissionsFor(role));
            }
        }
        saveRolePermissions(User.Role.SUPER_ADMIN, PermissionRegistry.allPermissions());
    }

    @Transactional(readOnly = true)
    public RolePermissionsDTO getMatrix() {
        Map<String, Set<String>> permissionsByRole = new LinkedHashMap<>();
        for (User.Role role : User.Role.values()) {
            permissionsByRole.put(role.name(), permissionsFor(role));
        }
        return new RolePermissionsDTO(Arrays.asList(User.Role.values()), PermissionRegistry.allPermissions(), permissionsByRole);
    }

    @Transactional(readOnly = true)
    public Set<String> permissionsFor(User.Role role) {
        if (role == User.Role.SUPER_ADMIN) {
            return PermissionRegistry.allPermissions();
        }

        Set<String> permissions = repository.findByRoleName(role.name()).stream()
                .map(RolePermission::getPermissionName)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (permissions.isEmpty()) {
            return PermissionRegistry.defaultPermissionsFor(role);
        }

        return permissions;
    }

    @Transactional
    public Set<String> updatePermissions(User.Role role, Set<String> permissions) {
        if (role == User.Role.SUPER_ADMIN) {
            saveRolePermissions(role, PermissionRegistry.allPermissions());
            return PermissionRegistry.allPermissions();
        }

        Set<String> sanitized = new LinkedHashSet<>();
        Set<String> allowed = PermissionRegistry.allPermissions();
        if (permissions != null) {
            for (String permission : permissions) {
                if (allowed.contains(permission)) {
                    sanitized.add(permission);
                }
            }
        }
        saveRolePermissions(role, sanitized);
        return sanitized;
    }

    private void saveRolePermissions(User.Role role, Set<String> permissions) {
        repository.deleteByRoleName(role.name());
        List<RolePermission> rows = permissions.stream()
                .map(permission -> new RolePermission(role.name(), permission))
                .toList();
        repository.saveAll(rows);
    }
}
