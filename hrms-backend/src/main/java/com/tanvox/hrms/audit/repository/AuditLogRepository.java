package com.tanvox.hrms.audit.repository;

import com.tanvox.hrms.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT al FROM AuditLog al WHERE al.actorUserId = ?1 AND al.isDeleted = false ORDER BY al.createdAt DESC")
    Page<AuditLog> findByActorUserId(Long userId, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.module = ?1 AND al.isDeleted = false ORDER BY al.createdAt DESC")
    Page<AuditLog> findByModule(String module, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.action = ?1 AND al.isDeleted = false ORDER BY al.createdAt DESC")
    Page<AuditLog> findByAction(String action, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN ?1 AND ?2 AND al.isDeleted = false ORDER BY al.createdAt DESC")
    Page<AuditLog> findByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query("SELECT al FROM AuditLog al WHERE al.entityId = ?1 AND al.entityType = ?2 AND al.isDeleted = false ORDER BY al.createdAt DESC")
    List<AuditLog> findEntityAuditTrail(Long entityId, String entityType);
}
