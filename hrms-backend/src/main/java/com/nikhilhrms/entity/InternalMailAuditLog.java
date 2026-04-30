package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "internal_mail_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalMailAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "actor_employee_id", nullable = false)
    private Employee actor;

    private Long messageId;

    @Column(nullable = false)
    private String action;

    @Column(length = 1200)
    private String detail;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
