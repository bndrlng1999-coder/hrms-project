package com.tanvox.hrms.identity.repository;

import com.tanvox.hrms.identity.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);

    @Query("SELECT p FROM Permission p WHERE p.code = ?1 AND p.isDeleted = false")
    Optional<Permission> findActiveByCode(String code);

    @Query("SELECT p FROM Permission p WHERE p.id = ?1 AND p.isDeleted = false")
    Optional<Permission> findActiveById(Long id);
}
