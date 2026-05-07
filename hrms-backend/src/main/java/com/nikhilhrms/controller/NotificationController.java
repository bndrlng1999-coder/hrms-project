package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.ProjectTrackerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private ProjectTrackerService projectTrackerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNotifications() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Notifications retrieved", projectTrackerService.getNotifications()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Notification marked read", projectTrackerService.markNotificationRead(id)));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> markAllRead() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Notifications marked read", projectTrackerService.markAllNotificationsRead()));
    }
}
