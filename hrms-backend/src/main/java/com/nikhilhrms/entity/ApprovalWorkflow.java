package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "approval_workflows", indexes = {
        @Index(name = "idx_approval_module_entity", columnList = "module,entity_id"),
        @Index(name = "idx_approval_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalWorkflow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Module module;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(nullable = false)
    private Integer currentLevel = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @ManyToOne
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    @Column(length = 1200)
    private String summary;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("level ASC")
    private List<ApprovalStep> steps = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    private LocalDateTime completedAt;

    public enum Module {
        ATTENDANCE,
        LEAVE,
        PAYROLL,
        CRM,
        REGULARIZATION,
        EXPENSE
    }
}
