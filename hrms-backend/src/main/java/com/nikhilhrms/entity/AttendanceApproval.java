package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_approvals", indexes = {
        @Index(name = "idx_attendance_approval_attendance", columnList = "attendance_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceApproval {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "attendance_id")
    private Attendance attendance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "acted_by")
    private User actedBy;

    @Column(nullable = false)
    private String action;

    @Column(length = 1000)
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
