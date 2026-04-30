package com.tanvox.hrms.identity.repository;

import com.tanvox.hrms.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByCode(String code);

    @Query("SELECT r FROM Role r WHERE r.code = ?1 AND r.isDeleted = false")
    Optional<Role> findActiveByCode(String code);

    @Query("SELECT r FROM Role r WHERE r.id = ?1 AND r.isDeleted = false")
    Optional<Role> findActiveById(Long id);
}
