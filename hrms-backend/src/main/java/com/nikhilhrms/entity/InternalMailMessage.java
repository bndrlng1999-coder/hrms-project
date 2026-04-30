package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "internal_mail_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalMailMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_mailbox_id", nullable = false)
    private InternalMailbox senderMailbox;

    @Column(nullable = false)
    private String subject;

    @Column(length = 8000)
    private String body;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    private Long parentMessageId;
    private Long threadId;

    @Column(nullable = false)
    private Boolean draft = false;

    @Column(nullable = false)
    private Boolean deletedBySender = false;

    @Column(nullable = false)
    private Boolean starredBySender = false;

    @Column(nullable = false)
    private Boolean importantBySender = false;
}
