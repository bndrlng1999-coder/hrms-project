package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "crm_deals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrmDeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @ManyToOne
    @JoinColumn(name = "lead_id")
    private CrmLead lead;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private CrmClient client;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private Employee owner;

    @Column(precision = 14, scale = 2)
    private BigDecimal value = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DealStatus status = DealStatus.OPEN;

    private LocalDate expectedCloseDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum DealStatus {
        OPEN,
        CEO_APPROVAL_PENDING,
        APPROVED,
        WON,
        LOST
    }
}
