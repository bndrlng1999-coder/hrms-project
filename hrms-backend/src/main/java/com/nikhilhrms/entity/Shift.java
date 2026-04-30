package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "shifts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Shift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime = LocalTime.of(9, 0);

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime = LocalTime.of(18, 0);

    @Column(name = "grace_period_minutes", nullable = false)
    private Integer gracePeriodMinutes = 10;

    @Column(name = "half_day_threshold_minutes", nullable = false)
    private Integer halfDayThresholdMinutes = 240;

    @Column(name = "full_day_minimum_minutes", nullable = false)
    private Integer fullDayMinimumMinutes = 480;

    @Column(name = "overtime_threshold_minutes", nullable = false)
    private Integer overtimeThresholdMinutes = 540;

    @Column(name = "weekend_rule", nullable = false)
    private String weekendRule = "SATURDAY_SUNDAY";

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
