package com.nikhilhrms.repository;

import com.nikhilhrms.entity.AppAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppAuditLogRepository extends JpaRepository<AppAuditLog, Long> {
}
