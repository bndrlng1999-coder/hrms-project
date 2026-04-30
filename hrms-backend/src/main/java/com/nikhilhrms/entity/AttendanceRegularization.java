package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_regularizations", indexes = {
        @Index(name = "idx_regularization_attendance", columnList = "attendance_id"),
        @Index(name = "idx_regularization_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRegularization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "attendance_id")
    private Attendance attendance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "requested_by")
    private Employee requestedBy;

    @Column(nullable = false, length = 1200)
    private String reason;

    @Column(name = "requested_check_in")
    private LocalDateTime requestedCheckIn;

    @Column(name = "requested_check_out")
    private LocalDateTime requestedCheckOut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
