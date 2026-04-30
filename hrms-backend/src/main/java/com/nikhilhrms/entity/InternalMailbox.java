package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "internal_mailboxes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalMailbox {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @Column(nullable = false, unique = true)
    private String emailAddress;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private Boolean active = true;
}
