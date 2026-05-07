package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.ProjectTrackerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reports")
public class ProjectTrackerReportController {

    @Autowired
    private ProjectTrackerService projectTrackerService;

    @GetMapping("/project-tracker")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReports() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Project tracker reports retrieved", projectTrackerService.getReports()));
    }
}
