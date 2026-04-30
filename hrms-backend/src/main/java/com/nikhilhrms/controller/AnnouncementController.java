package com.nikhilhrms.controller;

import com.nikhilhrms.dto.AnnouncementDTO;
import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.AppAuditService;
import com.nikhilhrms.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/announcements")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @Autowired
    private AppAuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementDTO>>> getAllAnnouncements() {
        List<AnnouncementDTO> announcements = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(new ApiResponse<>(true, "Announcements retrieved", announcements));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ANNOUNCEMENT_CREATE')")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> createAnnouncement(@RequestBody AnnouncementDTO dto, Authentication authentication) {
        AnnouncementDTO created = announcementService.createAnnouncement(dto);
        auditService.record(authentication.getName(), "ANNOUNCEMENT", "ANNOUNCEMENT_CREATE", "Announcement", created.getId(), created.getTitle());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Announcement created", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> getAnnouncement(@PathVariable Long id) {
        AnnouncementDTO announcement = announcementService.getAnnouncement(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Announcement retrieved", announcement));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ANNOUNCEMENT_UPDATE')")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> updateAnnouncement(@PathVariable Long id, @RequestBody AnnouncementDTO dto, Authentication authentication) {
        AnnouncementDTO updated = announcementService.updateAnnouncement(id, dto);
        auditService.record(authentication.getName(), "ANNOUNCEMENT", "ANNOUNCEMENT_UPDATE", "Announcement", updated.getId(), updated.getTitle());
        return ResponseEntity.ok(new ApiResponse<>(true, "Announcement updated", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ANNOUNCEMENT_UPDATE')")
    public ResponseEntity<ApiResponse<String>> deleteAnnouncement(@PathVariable Long id, Authentication authentication) {
        announcementService.deleteAnnouncement(id);
        auditService.record(authentication.getName(), "ANNOUNCEMENT", "ANNOUNCEMENT_DELETE", "Announcement", id, "Announcement deleted");
        return ResponseEntity.ok(new ApiResponse<>(true, "Announcement deleted", ""));
    }
}
