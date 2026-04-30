package com.nikhilhrms.repository;

import com.nikhilhrms.entity.InternalMailMessage;
import com.nikhilhrms.entity.InternalMailRecipient;
import com.nikhilhrms.entity.InternalMailbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InternalMailRecipientRepository extends JpaRepository<InternalMailRecipient, Long> {
    List<InternalMailRecipient> findByRecipientMailboxAndDeletedByRecipientFalseOrderByMessageCreatedAtDesc(InternalMailbox mailbox);
    List<InternalMailRecipient> findByRecipientMailboxAndDeletedByRecipientTrueOrderByMessageUpdatedAtDesc(InternalMailbox mailbox);
    List<InternalMailRecipient> findByRecipientMailboxAndStarredTrueAndDeletedByRecipientFalseOrderByMessageCreatedAtDesc(InternalMailbox mailbox);
    List<InternalMailRecipient> findByMessage(InternalMailMessage message);
    Optional<InternalMailRecipient> findByMessageIdAndRecipientMailboxId(Long messageId, Long mailboxId);
    long countByRecipientMailboxAndReadStatusFalseAndDeletedByRecipientFalse(InternalMailbox mailbox);
}
