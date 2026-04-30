package com.nikhilhrms.repository;

import com.nikhilhrms.entity.InternalMailMessage;
import com.nikhilhrms.entity.InternalMailbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternalMailMessageRepository extends JpaRepository<InternalMailMessage, Long> {
    List<InternalMailMessage> findBySenderMailboxAndDraftFalseAndDeletedBySenderFalseOrderByCreatedAtDesc(InternalMailbox mailbox);
    List<InternalMailMessage> findBySenderMailboxAndDeletedBySenderTrueOrderByUpdatedAtDesc(InternalMailbox mailbox);
    List<InternalMailMessage> findBySubjectContainingIgnoreCaseOrBodyContainingIgnoreCase(String subject, String body);
}
