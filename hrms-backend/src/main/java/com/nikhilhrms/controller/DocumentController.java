package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/documents")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class DocumentController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllDocuments() {
        Map<String, Object> response = new HashMap<>();
        response.put("documents", new java.util.ArrayList<>());
        return ResponseEntity.ok(new ApiResponse<>(true, "Documents retrieved", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadDocument(@RequestBody Map<String, Object> request) {
        Map<String, Object> document = new HashMap<>();
        document.put("id", 1);
        document.put("name", request.get("name"));
        document.put("documentType", request.get("documentType"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Document uploaded", document));
    }
}
