package com.nikhilhrms.service;

import com.nikhilhrms.entity.AppAuditLog;
import com.nikhilhrms.repository.AppAuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AppAuditService {

    private final AppAuditLogRepository repository;

    public AppAuditService(AppAuditLogRepository repository) {
        this.repository = repository;
    }

    public void record(String actorEmail, String module, String action, String entityType, Long entityId, String details) {
        AppAuditLog log = new AppAuditLog();
        log.setActorEmail(actorEmail);
        log.setModule(module);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details);
        repository.save(log);
    }
}
