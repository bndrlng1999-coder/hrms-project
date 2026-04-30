package com.nikhilhrms.service;

import com.nikhilhrms.dto.AttendanceDTO;
import com.nikhilhrms.entity.*;
import com.nikhilhrms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private HolidayRepository holidayRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private WorkFromHomeRequestRepository workFromHomeRequestRepository;

    @Autowired
    private OnDutyRequestRepository onDutyRequestRepository;

    @Autowired
    private AttendanceRegularizationRepository regularizationRepository;

    @Autowired
    private AttendanceApprovalRepository attendanceApprovalRepository;

    @Autowired
    private AttendanceAuditLogRepository attendanceAuditLogRepository;

    @Value("${attendance.approval.required:true}")
    private boolean approvalRequired;

    public List<AttendanceDTO> getEmployeeAttendance(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAllAttendance() {
        return attendanceRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getPendingAttendance() {
        return attendanceRepository.findByStatusOrderByAttendanceDateDesc(Attendance.Status.PENDING_APPROVAL).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AttendanceDTO getToday(String email) {
        Employee employee = currentEmployee(email);
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), LocalDate.now())
                .orElseGet(() -> attendanceRepository.save(createAttendance(employee, LocalDate.now())));
        return mapToDTO(attendance);
    }

    public List<AttendanceDTO> getMyCalendar(String email, int year, int month) {
        Employee employee = currentEmployee(email);
        YearMonth yearMonth = YearMonth.of(year, month);
        return attendanceRepository.findByEmployeeIdAndAttendanceDateBetween(
                        employee.getId(), yearMonth.atDay(1), yearMonth.atEndOfMonth()
                ).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getMyHistory(String email) {
        return getEmployeeAttendance(currentEmployee(email).getId());
    }

    @Transactional
    public AttendanceDTO checkIn(String email) {
        Employee employee = currentEmployee(email);
        AttendanceDTO dto = new AttendanceDTO();
        dto.setEmployeeId(employee.getId());
        dto.setAttendanceDate(LocalDate.now());
        dto.setCheckInTime(LocalTime.now().toString());
        dto.setRemarks("Check-in from HRMS");
        return markAttendance(dto, email, false);
    }

    @Transactional
    public AttendanceDTO checkOut(String email) {
        Employee employee = currentEmployee(email);
        AttendanceDTO dto = new AttendanceDTO();
        dto.setEmployeeId(employee.getId());
        dto.setAttendanceDate(LocalDate.now());
        dto.setCheckOutTime(LocalTime.now().toString());
        dto.setRemarks("Check-out from HRMS");
        return markAttendance(dto, email, false);
    }

    @Transactional
    public AttendanceDTO markAttendance(AttendanceDTO dto, String requesterEmail, boolean canManageAttendance) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        if (!canManageAttendance && !employee.getUser().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new RuntimeException("You can only mark your own attendance");
        }

        LocalDate attendanceDate = dto.getAttendanceDate() == null ? LocalDate.now() : dto.getAttendanceDate();
        boolean wantsCheckOut = dto.getCheckOutTime() != null && !dto.getCheckOutTime().isBlank();

        try {
            Attendance attendance = attendanceRepository
                    .findWithLockByEmployeeIdAndAttendanceDate(employee.getId(), attendanceDate)
                    .orElseGet(() -> createAttendance(employee, attendanceDate));

            boolean changed = wantsCheckOut ? applyCheckOut(attendance) : applyCheckIn(attendance);

            if (dto.getRemarks() != null && !dto.getRemarks().isBlank()) {
                attendance.setRemarks(dto.getRemarks());
            }

            recalculateAttendance(attendance);
            attendance.setUpdatedAt(LocalDateTime.now());
            attendance = attendanceRepository.save(attendance);
            audit(attendance, requesterEmail, wantsCheckOut ? "CHECK_OUT" : "CHECK_IN", "Attendance request submitted");
            if (changed) {
                notifyHr(attendance);
            }
            return mapToDTO(attendance);
        } catch (DataIntegrityViolationException ex) {
            Attendance existing = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), attendanceDate)
                    .orElseThrow(() -> ex);
            return mapToDTO(existing);
        }
    }

    @Transactional
    public AttendanceDTO approveAttendance(Long attendanceId, String approverEmail) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found"));
        if (attendance.getStatus() == Attendance.Status.APPROVED) {
            throw new RuntimeException("Attendance is already approved");
        }
        if (attendance.getStatus() == Attendance.Status.REJECTED) {
            throw new RuntimeException("Rejected attendance cannot be approved");
        }
        if (attendance.getCheckInTime() == null) {
            throw new RuntimeException("Cannot approve attendance without check-in time");
        }

        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        attendance.setStatus(Attendance.Status.APPROVED);
        attendance.setApprovedBy(approver);
        attendance.setApprovedAt(LocalDateTime.now());
        attendance.setRejectionReason(null);
        recalculateAttendance(attendance);
        attendance.setUpdatedAt(LocalDateTime.now());
        attendance = attendanceRepository.save(attendance);
        recordApproval(attendance, approver, "APPROVED", null);
        audit(attendance, approverEmail, "APPROVE", "Attendance approved");
        notifyEmployee(attendance, "Attendance approved", "Your attendance for " + attendance.getAttendanceDate() + " was approved.");
        return mapToDTO(attendance);
    }

    @Transactional
    public AttendanceDTO rejectAttendance(Long attendanceId, String approverEmail, String reason) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found"));
        if (attendance.getStatus() == Attendance.Status.APPROVED) {
            throw new RuntimeException("Approved attendance cannot be rejected");
        }
        if (attendance.getStatus() == Attendance.Status.REJECTED) {
            throw new RuntimeException("Attendance is already rejected");
        }

        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        attendance.setStatus(Attendance.Status.REJECTED);
        attendance.setApprovedBy(approver);
        attendance.setApprovedAt(LocalDateTime.now());
        attendance.setRejectionReason(reason == null || reason.isBlank() ? "Rejected by HR" : reason.trim());
        attendance.setUpdatedAt(LocalDateTime.now());
        attendance = attendanceRepository.save(attendance);
        recordApproval(attendance, approver, "REJECTED", attendance.getRejectionReason());
        audit(attendance, approverEmail, "REJECT", attendance.getRejectionReason());
        notifyEmployee(attendance, "Attendance rejected", "Your attendance for " + attendance.getAttendanceDate() + " was rejected.");
        return mapToDTO(attendance);
    }

    @Transactional
    public Map<String, Object> requestRegularization(Long attendanceId, String email, Map<String, String> body) {
        Employee employee = currentEmployee(email);
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found"));
        if (!attendance.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("You can only regularize your own attendance");
        }
        AttendanceRegularization regularization = new AttendanceRegularization();
        regularization.setAttendance(attendance);
        regularization.setRequestedBy(employee);
        regularization.setReason(body.getOrDefault("reason", "Attendance correction requested"));
        regularization.setRequestedCheckIn(parseDateTime(body.get("requestedCheckIn")));
        regularization.setRequestedCheckOut(parseDateTime(body.get("requestedCheckOut")));
        regularization = regularizationRepository.save(regularization);
        attendance.setStatus(Attendance.Status.REGULARIZATION_REQUESTED);
        attendanceRepository.save(attendance);
        audit(attendance, email, "REGULARIZATION_REQUESTED", regularization.getReason());
        notifyHr(attendance);
        return regularizationDto(regularization);
    }

    @Transactional
    public Map<String, Object> decideRegularization(Long regularizationId, String approverEmail, boolean approve, String reason) {
        AttendanceRegularization regularization = regularizationRepository.findById(regularizationId)
                .orElseThrow(() -> new RuntimeException("Regularization request not found"));
        if (regularization.getStatus() != AttendanceRegularization.Status.PENDING) {
            throw new RuntimeException("Regularization request already decided");
        }
        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        Attendance attendance = regularization.getAttendance();
        regularization.setApprovedBy(approver);
        regularization.setApprovedAt(LocalDateTime.now());
        if (approve) {
            if (regularization.getRequestedCheckIn() != null) {
                attendance.setCheckInTime(regularization.getRequestedCheckIn());
            }
            if (regularization.getRequestedCheckOut() != null) {
                attendance.setCheckOutTime(regularization.getRequestedCheckOut());
            }
            regularization.setStatus(AttendanceRegularization.Status.APPROVED);
            attendance.setStatus(Attendance.Status.REGULARIZED);
            recalculateAttendance(attendance);
            attendanceRepository.save(attendance);
            audit(attendance, approverEmail, "REGULARIZATION_APPROVED", regularization.getReason());
        } else {
            regularization.setStatus(AttendanceRegularization.Status.REJECTED);
            regularization.setRejectionReason(reason == null || reason.isBlank() ? "Rejected" : reason);
            attendance.setStatus(Attendance.Status.REJECTED);
            attendance.setRejectionReason(regularization.getRejectionReason());
            attendanceRepository.save(attendance);
            audit(attendance, approverEmail, "REGULARIZATION_REJECTED", regularization.getRejectionReason());
        }
        regularization = regularizationRepository.save(regularization);
        return regularizationDto(regularization);
    }

    public List<Map<String, Object>> getPendingRegularizations() {
        return regularizationRepository.findByStatus(AttendanceRegularization.Status.PENDING).stream()
                .map(this::regularizationDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> requestWorkFromHome(String email, Map<String, String> body) {
        Employee employee = currentEmployee(email);
        LocalDate requestDate = parseDate(body.get("requestDate"), LocalDate.now());
        WorkFromHomeRequest request = new WorkFromHomeRequest();
        request.setEmployee(employee);
        request.setRequestDate(requestDate);
        request.setReason(body.getOrDefault("reason", "Work from home requested"));
        request = workFromHomeRequestRepository.save(request);
        notifyHr(attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), requestDate)
                .orElseGet(() -> createAttendance(employee, requestDate)));
        return wfhDto(request);
    }

    @Transactional
    public Map<String, Object> approveWorkFromHome(Long id, String approverEmail) {
        WorkFromHomeRequest request = workFromHomeRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("WFH request not found"));
        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        request.setStatus(WorkFromHomeRequest.RequestStatus.APPROVED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());
        request = workFromHomeRequestRepository.save(request);
        Employee employee = request.getEmployee();
        LocalDate requestDate = request.getRequestDate();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), requestDate)
                .orElseGet(() -> createAttendance(employee, requestDate));
        attendance.setStatus(Attendance.Status.WORK_FROM_HOME);
        attendanceRepository.save(attendance);
        audit(attendance, approverEmail, "WFH_APPROVED", request.getReason());
        return wfhDto(request);
    }

    @Transactional
    public Map<String, Object> requestOnDuty(String email, Map<String, String> body) {
        Employee employee = currentEmployee(email);
        OnDutyRequest request = new OnDutyRequest();
        request.setEmployee(employee);
        request.setRequestDate(parseDate(body.get("requestDate"), LocalDate.now()));
        request.setReason(body.getOrDefault("reason", "On-duty request"));
        request.setLocation(body.get("location"));
        request = onDutyRequestRepository.save(request);
        return onDutyDto(request);
    }

    @Transactional
    public Map<String, Object> approveOnDuty(Long id, String approverEmail) {
        OnDutyRequest request = onDutyRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("On-duty request not found"));
        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));
        request.setStatus(WorkFromHomeRequest.RequestStatus.APPROVED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());
        request = onDutyRequestRepository.save(request);
        Employee employee = request.getEmployee();
        LocalDate requestDate = request.getRequestDate();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), requestDate)
                .orElseGet(() -> createAttendance(employee, requestDate));
        attendance.setStatus(Attendance.Status.ON_DUTY);
        attendanceRepository.save(attendance);
        audit(attendance, approverEmail, "ON_DUTY_APPROVED", request.getReason());
        return onDutyDto(request);
    }

    public Map<String, Object> monthlyReport(int year, int month, Long employeeId) {
        YearMonth yearMonth = YearMonth.of(year, month);
        List<Attendance> rows = employeeId == null
                ? attendanceRepository.findByAttendanceDateBetween(yearMonth.atDay(1), yearMonth.atEndOfMonth())
                : attendanceRepository.findByEmployeeIdAndAttendanceDateBetween(employeeId, yearMonth.atDay(1), yearMonth.atEndOfMonth());
        Map<String, Long> byStatus = rows.stream()
                .collect(Collectors.groupingBy(att -> att.getStatus().name(), TreeMap::new, Collectors.counting()));
        int workMinutes = rows.stream().mapToInt(att -> value(att.getWorkMinutes())).sum();
        int overtimeMinutes = rows.stream().mapToInt(att -> value(att.getOvertimeMinutes())).sum();
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("year", year);
        report.put("month", month);
        report.put("employeeId", employeeId);
        report.put("totalRecords", rows.size());
        report.put("workMinutes", workMinutes);
        report.put("overtimeMinutes", overtimeMinutes);
        report.put("byStatus", byStatus);
        report.put("records", rows.stream().map(this::mapToDTO).collect(Collectors.toList()));
        return report;
    }

    private Attendance createAttendance(Employee employee, LocalDate attendanceDate) {
        Attendance attendance = new Attendance();
        attendance.setEmployee(employee);
        attendance.setAttendanceDate(attendanceDate);
        attendance.setDepartmentId(employee.getDepartment() == null ? null : employee.getDepartment().getId());
        attendance.setManagerId(employee.getManagerId());
        attendance.setStatus(baseStatus(employee, attendanceDate));
        attendance.setRemarks("Marked from HRMS");
        return attendance;
    }

    private boolean applyCheckIn(Attendance attendance) {
        if (isProtectedDayStatus(attendance.getStatus())) {
            return false;
        }
        if (attendance.getCheckInTime() == null) {
            attendance.setCheckInTime(LocalDateTime.now());
            attendance.setStatus(approvalRequired ? Attendance.Status.PENDING_APPROVAL : Attendance.Status.APPROVED);
            clearApproval(attendance);
            return true;
        }
        return false;
    }

    private boolean applyCheckOut(Attendance attendance) {
        if (isProtectedDayStatus(attendance.getStatus())) {
            return false;
        }
        if (attendance.getCheckInTime() == null) {
            throw new RuntimeException("Check-in is required before check-out");
        }
        if (attendance.getCheckOutTime() == null) {
            attendance.setCheckOutTime(LocalDateTime.now());
            attendance.setStatus(approvalRequired ? Attendance.Status.PENDING_APPROVAL : Attendance.Status.APPROVED);
            clearApproval(attendance);
            return true;
        }
        return false;
    }

    private void clearApproval(Attendance attendance) {
        attendance.setApprovedBy(null);
        attendance.setApprovedAt(null);
        attendance.setRejectionReason(null);
    }

    private Attendance.Status baseStatus(Employee employee, LocalDate date) {
        if (leaveRequestRepository.existsByEmployeeIdAndStatusAndFromDateLessThanEqualAndToDateGreaterThanEqual(
                employee.getId(), LeaveRequest.Status.APPROVED, date, date)) {
            return Attendance.Status.ON_LEAVE;
        }
        if (holidayRepository.findByHolidayDateAndActiveTrue(date).isPresent()) {
            return Attendance.Status.HOLIDAY;
        }
        Shift shift = shiftFor(employee, date);
        if (isWeekOff(date, shift)) {
            return Attendance.Status.WEEK_OFF;
        }
        return approvalRequired ? Attendance.Status.PENDING_APPROVAL : Attendance.Status.APPROVED;
    }

    private boolean isProtectedDayStatus(Attendance.Status status) {
        return status == Attendance.Status.ON_LEAVE || status == Attendance.Status.HOLIDAY || status == Attendance.Status.WEEK_OFF;
    }

    private Shift shiftFor(Employee employee, LocalDate date) {
        List<ShiftAssignment> employeeAssignments = shiftAssignmentRepository.findByEmployeeIdAndActiveTrue(employee.getId());
        Optional<ShiftAssignment> assignment = employeeAssignments.stream()
                .filter(item -> activeOn(item, date))
                .findFirst();
        if (assignment.isEmpty() && employee.getDepartment() != null) {
            assignment = shiftAssignmentRepository.findByDepartmentIdAndActiveTrue(employee.getDepartment().getId()).stream()
                    .filter(item -> activeOn(item, date))
                    .findFirst();
        }
        return assignment.map(ShiftAssignment::getShift)
                .orElseGet(() -> shiftRepository.findByName("General Shift").orElseGet(this::defaultShift));
    }

    private Shift defaultShift() {
        Shift shift = new Shift();
        shift.setName("General Shift");
        return shiftRepository.save(shift);
    }

    private boolean activeOn(ShiftAssignment assignment, LocalDate date) {
        boolean starts = !assignment.getEffectiveFrom().isAfter(date);
        boolean ends = assignment.getEffectiveTo() == null || !assignment.getEffectiveTo().isBefore(date);
        return starts && ends;
    }

    private boolean isWeekOff(LocalDate date, Shift shift) {
        DayOfWeek day = date.getDayOfWeek();
        if ("SUNDAY".equalsIgnoreCase(shift.getWeekendRule())) {
            return day == DayOfWeek.SUNDAY;
        }
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private void recalculateAttendance(Attendance attendance) {
        Shift shift = shiftFor(attendance.getEmployee(), attendance.getAttendanceDate());
        if (attendance.getCheckInTime() != null) {
            LocalDateTime expectedStart = LocalDateTime.of(attendance.getAttendanceDate(), shift.getStartTime())
                    .plusMinutes(shift.getGracePeriodMinutes());
            attendance.setLateMinutes((int) Math.max(0, Duration.between(expectedStart, attendance.getCheckInTime()).toMinutes()));
        }
        if (attendance.getCheckInTime() != null && attendance.getCheckOutTime() != null) {
            int workMinutes = (int) Math.max(0, Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime()).toMinutes());
            LocalDateTime expectedEnd = LocalDateTime.of(attendance.getAttendanceDate(), shift.getEndTime());
            attendance.setWorkMinutes(workMinutes);
            attendance.setEarlyLogoutMinutes((int) Math.max(0, Duration.between(attendance.getCheckOutTime(), expectedEnd).toMinutes()));
            attendance.setOvertimeMinutes(Math.max(0, workMinutes - shift.getOvertimeThresholdMinutes()));
        }
    }

    private void notifyHr(Attendance attendance) {
        if (attendance.getStatus() != Attendance.Status.PENDING_APPROVAL) {
            return;
        }
        List<Employee> reviewers = employeeRepository.findByUserRoleIn(Arrays.asList(
                User.Role.HR, User.Role.HR_MANAGER, User.Role.ADMIN, User.Role.SUPER_ADMIN
        ));
        String employeeName = fullName(attendance.getEmployee());
        reviewers.forEach(reviewer -> createNotification(
                reviewer,
                "Attendance waiting for approval",
                employeeName + " submitted attendance for " + attendance.getAttendanceDate() + ".",
                "/attendance/approvals"
        ));
    }

    private void notifyEmployee(Attendance attendance, String title, String message) {
        createNotification(attendance.getEmployee(), title, message, "/attendance");
    }

    private void createNotification(Employee recipient, String title, String message, String link) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notificationRepository.save(notification);
    }

    private Employee currentEmployee(String email) {
        return employeeRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Employee profile not found"));
    }

    private void recordApproval(Attendance attendance, User user, String action, String reason) {
        AttendanceApproval approval = new AttendanceApproval();
        approval.setAttendance(attendance);
        approval.setActedBy(user);
        approval.setAction(action);
        approval.setReason(reason);
        attendanceApprovalRepository.save(approval);
    }

    private void audit(Attendance attendance, String actorEmail, String action, String details) {
        Long actorId = userRepository.findByEmail(actorEmail).map(User::getId).orElse(null);
        AttendanceAuditLog log = new AttendanceAuditLog();
        log.setAttendance(attendance);
        log.setActorUserId(actorId);
        log.setAction(action);
        log.setDetails(details);
        attendanceAuditLogRepository.save(log);
    }

    private AttendanceDTO mapToDTO(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        dto.setEmployeeId(attendance.getEmployee().getId());
        dto.setEmployeeName(fullName(attendance.getEmployee()));
        dto.setAttendanceDate(attendance.getAttendanceDate());
        dto.setStatus(attendance.getStatus().toString());
        dto.setCheckInTime(formatDateTime(attendance.getCheckInTime()));
        dto.setCheckOutTime(formatDateTime(attendance.getCheckOutTime()));
        dto.setRemarks(attendance.getRemarks());
        dto.setRejectionReason(attendance.getRejectionReason());
        dto.setApprovedAt(formatDateTime(attendance.getApprovedAt()));
        dto.setDepartmentId(attendance.getDepartmentId());
        dto.setManagerId(attendance.getManagerId());
        dto.setWorkMinutes(attendance.getWorkMinutes());
        dto.setLateMinutes(attendance.getLateMinutes());
        dto.setEarlyLogoutMinutes(attendance.getEarlyLogoutMinutes());
        dto.setOvertimeMinutes(attendance.getOvertimeMinutes());
        if (attendance.getApprovedBy() != null) {
            dto.setApprovedById(attendance.getApprovedBy().getId());
            dto.setApprovedByName(attendance.getApprovedBy().getEmail());
        }
        if (attendance.getEmployee().getDepartment() != null) {
            dto.setDepartmentName(attendance.getEmployee().getDepartment().getName());
        }
        return dto;
    }

    private Map<String, Object> regularizationDto(AttendanceRegularization regularization) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", regularization.getId());
        dto.put("attendanceId", regularization.getAttendance().getId());
        dto.put("employeeName", fullName(regularization.getRequestedBy()));
        dto.put("attendanceDate", regularization.getAttendance().getAttendanceDate());
        dto.put("reason", regularization.getReason());
        dto.put("status", regularization.getStatus());
        dto.put("requestedCheckIn", formatDateTime(regularization.getRequestedCheckIn()));
        dto.put("requestedCheckOut", formatDateTime(regularization.getRequestedCheckOut()));
        dto.put("rejectionReason", regularization.getRejectionReason());
        return dto;
    }

    private Map<String, Object> wfhDto(WorkFromHomeRequest request) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", request.getId());
        dto.put("employeeId", request.getEmployee().getId());
        dto.put("employeeName", fullName(request.getEmployee()));
        dto.put("requestDate", request.getRequestDate());
        dto.put("reason", request.getReason());
        dto.put("status", request.getStatus());
        return dto;
    }

    private Map<String, Object> onDutyDto(OnDutyRequest request) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", request.getId());
        dto.put("employeeId", request.getEmployee().getId());
        dto.put("employeeName", fullName(request.getEmployee()));
        dto.put("requestDate", request.getRequestDate());
        dto.put("reason", request.getReason());
        dto.put("location", request.getLocation());
        dto.put("status", request.getStatus());
        return dto;
    }

    private LocalDate parseDate(String value, LocalDate fallback) {
        return value == null || value.isBlank() ? fallback : LocalDate.parse(value);
    }

    private LocalDateTime parseDateTime(String value) {
        return value == null || value.isBlank() ? null : LocalDateTime.parse(value);
    }

    private int value(Integer number) {
        return number == null ? 0 : number;
    }

    private String fullName(Employee employee) {
        return employee.getFirstName() + " " + employee.getLastName();
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? null : value.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
