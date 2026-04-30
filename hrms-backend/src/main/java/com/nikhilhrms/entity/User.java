package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus accountStatus = AccountStatus.PENDING_VERIFICATION;

    @Column(nullable = false)
    private Boolean verified = false;

    @Column(nullable = false)
    private Boolean firstLogin = true;

    @Column(nullable = true)
    private LocalDateTime lastLogin;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Role {
        SUPER_ADMIN,
        ADMIN,
        FINANCE,
        CEO,
        CTO,
        HR_MANAGER,
        HR,
        PROJECT_MANAGER,
        TEAM_LEAD,
        DEVELOPER,
        MARKETING_MANAGER,
        MARKETING_EXECUTIVE,
        INTERN,
        EMPLOYEE,
        MANAGER
    }

    public enum AccountStatus {
        PENDING_VERIFICATION,
        ACTIVE,
        INACTIVE,
        DISABLED,
        LOCKED
    }
}
