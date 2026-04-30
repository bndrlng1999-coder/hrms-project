package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_follow_ups")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrmFollowUp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "lead_id")
    private CrmLead lead;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private Employee owner;

    @Column(nullable = false)
    private LocalDateTime followUpAt;

    @Column(length = 1500)
    private String notes;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
