package com.nikhilhrms.repository;

import com.nikhilhrms.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRoleName(String roleName);
    void deleteByRoleName(String roleName);
    boolean existsByRoleName(String roleName);
}
