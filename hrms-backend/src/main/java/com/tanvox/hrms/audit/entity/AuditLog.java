package com.tanvox.hrms.audit.entity;

import com.tanvox.hrms.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AuditLog entity for tracking all sensitive operations in the system.
 * Provides complete audit trail for compliance and security monitoring.
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_actor_user_id", columnList = "actor_user_id"),
    @Index(name = "idx_module", columnList = "module"),
    @Index(name = "idx_action", columnList = "action"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;

    @Column(name = "actor_email", length = 255)
    private String actorEmail;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 100)
    private String module;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(columnDefinition = "LONGTEXT")
    private String oldValue;

    @Column(columnDefinition = "LONGTEXT")
    private String newValue;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(length = 500)
    private String description;

    @Column(name = "status", length = 50)
    private String status;

    // Action types for common operations
    public static final class ActionType {
        public static final String CREATE = "CREATE";
        public static final String UPDATE = "UPDATE";
        public static final String DELETE = "DELETE";
        public static final String LOGIN = "LOGIN";
        public static final String LOGOUT = "LOGOUT";
        public static final String LOGIN_FAILED = "LOGIN_FAILED";
        public static final String PASSWORD_CHANGE = "PASSWORD_CHANGE";
        public static final String PASSWORD_RESET = "PASSWORD_RESET";
        public static final String ROLE_ASSIGN = "ROLE_ASSIGN";
        public static final String PERMISSION_ASSIGN = "PERMISSION_ASSIGN";
        public static final String ACCESS_GRANTED = "ACCESS_GRANTED";
        public static final String ACCESS_DENIED = "ACCESS_DENIED";
        public static final String USER_LOCK = "USER_LOCK";
        public static final String USER_UNLOCK = "USER_UNLOCK";
    }

    // Module types
    public static final class ModuleType {
        public static final String IDENTITY = "IDENTITY";
        public static final String EMPLOYEE = "EMPLOYEE";
        public static final String ATTENDANCE = "ATTENDANCE";
        public static final String LEAVE = "LEAVE";
        public static final String PAYROLL = "PAYROLL";
        public static final String PROJECT = "PROJECT";
        public static final String INTERNAL_MAIL = "INTERNAL_MAIL";
        public static final String SETTINGS = "SETTINGS";
        public static final String AUDIT = "AUDIT";
    }

    // Status types
    public static final class Status {
        public static final String SUCCESS = "SUCCESS";
        public static final String FAILURE = "FAILURE";
        public static final String PENDING = "PENDING";
    }
}
