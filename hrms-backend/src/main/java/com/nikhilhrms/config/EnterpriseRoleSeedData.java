package com.nikhilhrms.config;

import com.nikhilhrms.entity.Department;
import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.User;
import com.nikhilhrms.repository.DepartmentRepository;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.UserRepository;
import com.nikhilhrms.service.InternalMailService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Locale;

@Configuration
public class EnterpriseRoleSeedData {

    @Bean
    @Order(100)
    CommandLineRunner seedEnterpriseRoleUsers(
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            InternalMailService internalMailService,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            Department leadership = departmentRepository.findAll().stream()
                    .filter(department -> "Leadership".equalsIgnoreCase(department.getName()))
                    .findFirst()
                    .orElseGet(() -> {
                        Department department = new Department();
                        department.setName("Leadership");
                        department.setDescription("Executive and platform administration");
                        department.setIsActive(true);
                        return departmentRepository.save(department);
                    });

            for (User.Role role : User.Role.values()) {
                String email = role.name().toLowerCase(Locale.ROOT).replace('_', '.') + "@tanvox.com";
                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    User created = new User();
                    created.setEmail(email);
                    created.setPassword(passwordEncoder.encode("password123"));
                    created.setRole(role);
                    created.setIsActive(true);
                    created.setAccountStatus(User.AccountStatus.ACTIVE);
                    created.setVerified(true);
                    created.setFirstLogin(false);
                    return userRepository.save(created);
                });

                if (!Boolean.TRUE.equals(user.getIsActive()) || user.getRole() != role || user.getAccountStatus() != User.AccountStatus.ACTIVE) {
                    user.setIsActive(true);
                    user.setRole(role);
                    user.setAccountStatus(User.AccountStatus.ACTIVE);
                    user.setVerified(true);
                    user.setFirstLogin(false);
                    userRepository.save(user);
                }

                Employee employee = employeeRepository.findByUserId(user.getId()).orElseGet(() -> {
                    Employee created = new Employee();
                    created.setUser(user);
                    created.setFirstName(toName(role.name()));
                    created.setLastName("User");
                    created.setEmployeeCode("TVX-" + String.format("%03d", role.ordinal() + 1));
                    created.setDepartment(leadership);
                    created.setDesignation(role.name().replace('_', ' '));
                    created.setJoiningDate(LocalDate.now().minusYears(1));
                    created.setPhoneNumber("900000" + String.format("%04d", role.ordinal() + 1));
                    created.setIsActive(true);
                    return employeeRepository.save(created);
                });

                internalMailService.ensureMailbox(employee);
            }
        };
    }

    private String toName(String role) {
        String[] parts = role.toLowerCase(Locale.ROOT).split("_");
        StringBuilder name = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            if (!name.isEmpty()) {
                name.append(' ');
            }
            name.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return name.toString();
    }
}
