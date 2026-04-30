package com.nikhilhrms.controller;

import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.entity.Holiday;
import com.nikhilhrms.repository.HolidayRepository;
import com.nikhilhrms.service.AppAuditService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/holidays")
public class HolidayController {

    private final HolidayRepository holidayRepository;
    private final AppAuditService auditService;

    public HolidayController(HolidayRepository holidayRepository, AppAuditService auditService) {
        this.holidayRepository = holidayRepository;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Holiday>>> getHolidays(
            @RequestParam(required = false) Integer year
    ) {
        int targetYear = year == null ? LocalDate.now().getYear() : year;
        return ResponseEntity.ok(new ApiResponse<>(true, "Holidays retrieved",
                holidayRepository.findByHolidayDateBetweenOrderByHolidayDate(LocalDate.of(targetYear, 1, 1), LocalDate.of(targetYear, 12, 31))));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('HOLIDAY_CREATE')")
    public ResponseEntity<ApiResponse<Holiday>> createHoliday(@RequestBody Map<String, String> body, Authentication authentication) {
        Holiday holiday = new Holiday();
        holiday.setName(body.getOrDefault("name", "Holiday"));
        holiday.setHolidayDate(LocalDate.parse(body.get("holidayDate")));
        holiday.setOptionalHoliday(Boolean.valueOf(body.getOrDefault("optionalHoliday", "false")));
        Holiday created = holidayRepository.save(holiday);
        auditService.record(authentication.getName(), "HOLIDAY", "HOLIDAY_CREATE", "Holiday", created.getId(), created.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Holiday created", created));
    }
}
