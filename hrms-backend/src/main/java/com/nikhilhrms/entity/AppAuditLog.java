package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_audit_logs", indexes = {
        @Index(name = "idx_app_audit_action", columnList = "action"),
        @Index(name = "idx_app_audit_module", columnList = "module"),
        @Index(name = "idx_app_audit_actor", columnList = "actor_email")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_email", length = 180)
    private String actorEmail;

    @Column(nullable = false, length = 80)
    private String module;

    @Column(nullable = false, length = 120)
    private String action;

    @Column(name = "entity_type", length = 120)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(length = 2000)
    private String details;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
