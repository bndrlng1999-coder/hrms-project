package com.nikhilhrms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "internal_mail_recipients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalMailRecipient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private InternalMailMessage message;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recipient_mailbox_id", nullable = false)
    private InternalMailbox recipientMailbox;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecipientType recipientType = RecipientType.TO;

    @Column(nullable = false)
    private Boolean readStatus = false;

    private LocalDateTime readAt;

    @Column(nullable = false)
    private Boolean deletedByRecipient = false;

    @Column(nullable = false)
    private Boolean starred = false;

    @Column(nullable = false)
    private Boolean important = false;

    public enum RecipientType {
        TO, CC, BCC
    }
}
