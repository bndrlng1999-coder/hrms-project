package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_leads", indexes = {
        @Index(name = "idx_crm_lead_status", columnList = "status"),
        @Index(name = "idx_crm_lead_sla", columnList = "sla_status,sla_due_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrmLead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String company;
    private String email;
    private String phone;

    @Column(length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeadStatus status = LeadStatus.NEW;

    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private Employee assignedTo;

    @Column(name = "sla_start_time", nullable = false)
    private LocalDateTime slaStartTime = LocalDateTime.now();

    @Column(name = "sla_due_time", nullable = false)
    private LocalDateTime slaDueTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "sla_status", nullable = false)
    private SlaStatus slaStatus = SlaStatus.ON_TIME;

    private LocalDateTime lastContactedAt;
    private LocalDateTime nextFollowUpAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum LeadStatus {
        NEW,
        CONTACTED,
        FOLLOW_UP,
        PROPOSAL,
        NEGOTIATION,
        CONVERTED,
        LOST
    }

    public enum SlaStatus {
        ON_TIME,
        AT_RISK,
        BREACHED
    }
}
