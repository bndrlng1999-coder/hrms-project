package com.nikhilhrms.repository;

import com.nikhilhrms.entity.InternalMailAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternalMailAttachmentRepository extends JpaRepository<InternalMailAttachment, Long> {
    List<InternalMailAttachment> findByMessageId(Long messageId);
}
