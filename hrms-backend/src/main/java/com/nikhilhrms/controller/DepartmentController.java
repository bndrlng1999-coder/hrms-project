package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/departments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class DepartmentController {

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<Map<String, Object>>>> getAllDepartments() {
        java.util.List<Map<String, Object>> departments = Arrays.asList(
            createDept(1L, "Engineering"),
            createDept(2L, "HR"),
            createDept(3L, "Sales"),
            createDept(4L, "Finance")
        );
        return ResponseEntity.ok(new ApiResponse<>(true, "Departments retrieved", departments));
    }

    private Map<String, Object> createDept(Long id, String name) {
        Map<String, Object> dept = new HashMap<>();
        dept.put("id", id);
        dept.put("name", name);
        dept.put("isActive", true);
        return dept;
    }
}
