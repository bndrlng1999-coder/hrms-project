package com.nikhilhrms.repository;

import com.nikhilhrms.entity.InternalMailAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InternalMailAuditLogRepository extends JpaRepository<InternalMailAuditLog, Long> {
}
