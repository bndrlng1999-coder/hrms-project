package com.nikhilhrms.repository;

import com.nikhilhrms.entity.AppAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppAuditLogRepository extends JpaRepository<AppAuditLog, Long> {
    List<AppAuditLog> findAllByOrderByCreatedAtDesc();
}
