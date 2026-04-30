package com.nikhilhrms.service;

import com.nikhilhrms.dto.LoginRequest;
import com.nikhilhrms.dto.LoginResponse;
import com.nikhilhrms.dto.RegisterEmployeeRequest;
import com.nikhilhrms.dto.UserDTO;
import com.nikhilhrms.dto.ChangePasswordRequest;
import com.nikhilhrms.entity.Department;
import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.User;
import com.nikhilhrms.repository.DepartmentRepository;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.UserRepository;
import com.nikhilhrms.security.JwtProvider;
import com.nikhilhrms.security.PermissionRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserManagementService userManagementService;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new RuntimeException("User account is inactive");
        }

        if (user.getAccountStatus() == User.AccountStatus.DISABLED) {
            throw new RuntimeException("User account is disabled");
        }

        if (user.getAccountStatus() == User.AccountStatus.LOCKED) {
            throw new RuntimeException("User account is locked");
        }

        // Update last login
        userManagementService.updateLastLogin(user.getId());

        String token = jwtProvider.generateToken(user.getEmail(), user.getRole().toString());
        UserDTO userDTO = new UserDTO(user.getId(), user.getEmail(), user.getRole(), user.getIsActive());
        userDTO.setAccountStatus(user.getAccountStatus());
        userDTO.setVerified(user.getVerified());
        userDTO.setFirstLogin(user.getFirstLogin());
        userDTO.setPermissions(PermissionRegistry.permissionsFor(user.getRole()));

        String message = user.getFirstLogin() ? 
            "Login successful. Please change your password on first login." : 
            "Login successful";

        return new LoginResponse(token, userDTO, message);
    }

    /**
     * Change password (used on first login and by authenticated users)
     */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New passwords do not match");
        }

        if (request.getNewPassword().length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());

        // If first login, mark as verified
        if (user.getFirstLogin()) {
            userManagementService.markAsVerified(user.getId());
        } else {
            userRepository.save(user);
        }
    }

    public LoginResponse registerEmployee(RegisterEmployeeRequest request) {
        throw new RuntimeException("Public registration is disabled. Only SUPER_ADMIN can create users.");
    }

    public LoginResponse registerEmployee(RegisterEmployeeRequest request, User.Role role) {
        throw new RuntimeException("Public registration is disabled. Only SUPER_ADMIN can create users.");
        /*
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setIsActive(true);
        user.setAccountStatus(User.AccountStatus.ACTIVE);
        user.setVerified(true);
        user.setFirstLogin(false);
        user = userRepository.save(user);

        // Create employee
        Employee employee = new Employee();
        employee.setUser(user);
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmployeeCode(request.getEmployeeCode());
        employee.setDesignation(request.getDesignation());
        employee.setPhoneNumber(request.getPhoneNumber());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            employee.setDepartment(department);
        }

        employee.setIsActive(true);
        employeeRepository.save(employee);

        // Return token
        String token = jwtProvider.generateToken(user.getEmail(), user.getRole().toString());
        UserDTO userDTO = new UserDTO(user.getId(), user.getEmail(), user.getRole(), user.getIsActive());
        userDTO.setPermissions(PermissionRegistry.permissionsFor(user.getRole()));

        return new LoginResponse(token, userDTO, "Registration successful");
        */
    }
}
