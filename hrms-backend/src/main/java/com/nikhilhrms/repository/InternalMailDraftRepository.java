package com.nikhilhrms.repository;

import com.nikhilhrms.entity.InternalMailDraft;
import com.nikhilhrms.entity.InternalMailbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternalMailDraftRepository extends JpaRepository<InternalMailDraft, Long> {
    List<InternalMailDraft> findBySenderMailboxOrderByUpdatedAtDesc(InternalMailbox mailbox);
}
