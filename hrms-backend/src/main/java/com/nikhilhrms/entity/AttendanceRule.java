package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name = "Default Attendance Rule";

    @Column(nullable = false)
    private Boolean managerApprovalEnabled = true;

    @Column(nullable = false)
    private Boolean hrApprovalEnabled = true;

    @Column(nullable = false)
    private Boolean approvalRequired = true;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
