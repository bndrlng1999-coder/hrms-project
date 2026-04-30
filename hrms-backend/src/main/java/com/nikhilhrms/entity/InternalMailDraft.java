package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "internal_mail_drafts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalMailDraft {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_mailbox_id", nullable = false)
    private InternalMailbox senderMailbox;

    private String subject;

    @Column(length = 8000)
    private String body;

    @Column(length = 3000)
    private String recipientMailboxIds;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
