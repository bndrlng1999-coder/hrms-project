package com.nikhilhrms.service;

import com.nikhilhrms.dto.CreateUserRequest;
import com.nikhilhrms.dto.UserDTO;
import com.nikhilhrms.entity.Department;
import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.User;
import com.nikhilhrms.repository.DepartmentRepository;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.UUID;

/**
 * Service for User Management - SUPER_ADMIN operations
 */
@Service
public class UserManagementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RolePermissionService rolePermissionService;

    /**
     * Get all users
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get user by ID
     */
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDTO(user);
    }

    /**
     * Create new user with temporary password
     * Sets account status to PENDING_VERIFICATION
     * Employee record is created based on request
     */
    @Transactional
    public UserDTO createUser(CreateUserRequest request) {
        String email = request.getEmail() == null || request.getEmail().isBlank()
                ? generateInternalEmail(request.getFirstName(), request.getLastName())
                : request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        // Generate temporary password
        String tempPassword = generateTemporaryPassword();

        // Create User
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setRole(request.getRole());
        user.setIsActive(!Boolean.FALSE.equals(request.getIsActive()));
        user.setAccountStatus(User.AccountStatus.PENDING_VERIFICATION);
        user.setVerified(false);
        user.setFirstLogin(true);
        user = userRepository.save(user);

        String employeeCode = null;
        // Create Employee record if department is provided
        if (request.getDepartmentId() != null) {
            Employee employee = new Employee();
            employee.setUser(user);
            employee.setFirstName(request.getFirstName());
            employee.setLastName(request.getLastName());
            employee.setDesignation(request.getDesignation());
            employeeCode = generateEmployeeCode();
            employee.setEmployeeCode(employeeCode);

            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            employee.setDepartment(department);

            if (request.getReportingManagerId() != null) {
                Employee reportingManager = employeeRepository.findById(request.getReportingManagerId())
                        .orElseThrow(() -> new RuntimeException("Reporting manager not found"));
                employee.setManagerId(reportingManager.getId());
            }

            employee.setIsActive(true);
            employeeRepository.save(employee);
        }

        UserDTO userDTO = convertToDTO(user);
        userDTO.setEmployeeCode(employeeCode);
        userDTO.setTemporaryPassword(tempPassword);
        return userDTO;
    }

    /**
     * Assign role to user (SUPER_ADMIN can assign any role)
     */
    @Transactional
    public UserDTO assignRole(Long userId, User.Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        return convertToDTO(user);
    }

    /**
     * Update user account status
     */
    @Transactional
    public UserDTO updateAccountStatus(Long userId, User.AccountStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountStatus(status);
        if (status == User.AccountStatus.ACTIVE) {
            user.setIsActive(true);
        } else if (status == User.AccountStatus.INACTIVE || status == User.AccountStatus.DISABLED) {
            user.setIsActive(false);
        }
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        return convertToDTO(user);
    }

    /**
     * Reset password and generate new temporary password
     */
    @Transactional
    public String resetPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String tempPassword = generateTemporaryPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setFirstLogin(true);
        user.setVerified(false);
        user.setAccountStatus(User.AccountStatus.PENDING_VERIFICATION);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        
        // In production, send password via email
        return tempPassword;
    }

    /**
     * Soft delete - deactivate user
     */
    @Transactional
    public void deleteUser(Long userId) {
        disableUser(userId);
    }

    @Transactional
    public UserDTO disableUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(false);
        user.setAccountStatus(User.AccountStatus.DISABLED);
        user.setUpdatedAt(LocalDateTime.now());
        Employee employee = employeeRepository.findByUserId(userId).orElse(null);
        if (employee != null) {
            employee.setIsActive(false);
            employeeRepository.save(employee);
        }
        return convertToDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO enableUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(true);
        user.setAccountStatus(user.getVerified() ? User.AccountStatus.ACTIVE : User.AccountStatus.PENDING_VERIFICATION);
        user.setUpdatedAt(LocalDateTime.now());
        Employee employee = employeeRepository.findByUserId(userId).orElse(null);
        if (employee != null) {
            employee.setIsActive(true);
            employeeRepository.save(employee);
        }
        return convertToDTO(userRepository.save(user));
    }

    /**
     * Mark user as verified after first login password change
     */
    @Transactional
    public UserDTO markAsVerified(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setVerified(true);
        user.setFirstLogin(false);
        user.setAccountStatus(User.AccountStatus.ACTIVE);
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        return convertToDTO(user);
    }

    /**
     * Update last login timestamp
     */
    @Transactional
    public void updateLastLogin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Convert User entity to UserDTO
     */
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setIsActive(user.getIsActive());
        dto.setAccountStatus(user.getAccountStatus());
        dto.setVerified(user.getVerified());
        dto.setFirstLogin(user.getFirstLogin());
        dto.setLastLogin(user.getLastLogin());
        dto.setPermissions(rolePermissionService.permissionsFor(user.getRole()));
        employeeRepository.findByUserId(user.getId()).ifPresent(employee -> dto.setEmployeeCode(employee.getEmployeeCode()));
        return dto;
    }

    /**
     * Generate temporary password
     * Format: TempPass@XXXXXX where X is random alphanumeric
     */
    private String generateTemporaryPassword() {
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "TempPass@" + uuid;
    }

    /**
     * Generate unique employee code
     */
    private String generateEmployeeCode() {
        Long count = employeeRepository.count();
        return String.format("EMP%04d", count + 1);
    }

    private String generateInternalEmail(String firstName, String lastName) {
        String base = ((firstName == null ? "user" : firstName) + "." + (lastName == null ? "employee" : lastName))
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9.]", "")
                .replaceAll("\\.+", ".");
        String candidate = base + "@tanvox.local";
        int suffix = 1;
        while (userRepository.existsByEmail(candidate)) {
            candidate = base + suffix + "@tanvox.local";
            suffix++;
        }
        return candidate;
    }
}
