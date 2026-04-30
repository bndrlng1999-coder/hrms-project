package com.nikhilhrms.config;

import com.nikhilhrms.entity.Department;
import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.User;
import com.nikhilhrms.repository.DepartmentRepository;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DemoUserSeedData implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoUserSeedData(
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        Department engineering = department("Engineering");
        Department hr = department("Human Resources");
        Department finance = department("Finance");
        Department marketing = department("Marketing");
        Department leadership = department("Leadership");

        List<SeedUser> users = List.of(
                new SeedUser("superadmin@tanvox.local", "Admin@12345", User.Role.SUPER_ADMIN, "Super", "Admin", "TX-SA-001", leadership, "Platform Owner"),
                new SeedUser("admin@tanvox.local", "Admin@12345", User.Role.ADMIN, "System", "Admin", "TX-AD-001", leadership, "System Administrator"),
                new SeedUser("ceo@tanvox.local", "Ceo@12345", User.Role.CEO, "Chief", "Executive", "TX-CEO-001", leadership, "CEO"),
                new SeedUser("cto@tanvox.local", "Cto@12345", User.Role.CTO, "Chief", "Technology", "TX-CTO-001", engineering, "CTO"),
                new SeedUser("hrmanager@tanvox.local", "HrManager@12345", User.Role.HR_MANAGER, "HR", "Manager", "TX-HRM-001", hr, "HR Manager"),
                new SeedUser("hr@tanvox.local", "Hr@12345", User.Role.HR, "HR", "Executive", "TX-HR-001", hr, "HR Executive"),
                new SeedUser("pm@tanvox.local", "Pm@12345", User.Role.PROJECT_MANAGER, "Project", "Manager", "TX-PM-001", engineering, "Project Manager"),
                new SeedUser("lead@tanvox.local", "Lead@12345", User.Role.TEAM_LEAD, "Team", "Lead", "TX-TL-001", engineering, "Team Lead"),
                new SeedUser("developer@tanvox.local", "Dev@12345", User.Role.DEVELOPER, "Tanvox", "Developer", "TX-DEV-001", engineering, "Developer"),
                new SeedUser("marketingmanager@tanvox.local", "Marketing@12345", User.Role.MARKETING_MANAGER, "Marketing", "Manager", "TX-MM-001", marketing, "Marketing Manager"),
                new SeedUser("marketing@tanvox.local", "Marketing@12345", User.Role.MARKETING_EXECUTIVE, "Marketing", "Executive", "TX-ME-001", marketing, "Marketing Executive"),
                new SeedUser("finance@tanvox.local", "Finance@12345", User.Role.FINANCE, "Finance", "Officer", "TX-FIN-001", finance, "Finance Officer"),
                new SeedUser("intern@tanvox.local", "Intern@12345", User.Role.INTERN, "Tanvox", "Intern", "TX-INT-001", engineering, "Intern"),
                new SeedUser("employee@tanvox.local", "Employee@12345", User.Role.EMPLOYEE, "Tanvox", "Employee", "TX-EMP-001", engineering, "Employee")
        );

        users.forEach(this::seedUser);
    }

    private Department department(String name) {
        return departmentRepository.findByName(name).orElseGet(() -> {
            Department department = new Department();
            department.setName(name);
            department.setDescription(name + " Department");
            return departmentRepository.save(department);
        });
    }

    private void seedUser(SeedUser seed) {
        User user = userRepository.findByEmail(seed.email()).orElseGet(() -> {
            User created = new User();
            created.setEmail(seed.email());
            created.setPassword(passwordEncoder.encode(seed.password()));
            created.setRole(seed.role());
            created.setIsActive(true);
            created.setAccountStatus(User.AccountStatus.ACTIVE);
            created.setVerified(true);
            created.setFirstLogin(false);
            return userRepository.save(created);
        });
        if (user.getAccountStatus() != User.AccountStatus.ACTIVE || Boolean.TRUE.equals(user.getFirstLogin()) || !Boolean.TRUE.equals(user.getVerified())) {
            user.setAccountStatus(User.AccountStatus.ACTIVE);
            user.setVerified(true);
            user.setFirstLogin(false);
            user.setIsActive(true);
            userRepository.save(user);
        }

        employeeRepository.findByUserId(user.getId()).orElseGet(() -> {
            Employee employee = new Employee();
            employee.setUser(user);
            employee.setFirstName(seed.firstName());
            employee.setLastName(seed.lastName());
            employee.setEmployeeCode(seed.employeeCode());
            employee.setDepartment(seed.department());
            employee.setDesignation(seed.designation());
            employee.setJoiningDate(LocalDate.now().minusYears(1));
            employee.setIsActive(true);
            return employeeRepository.save(employee);
        });
    }

    private record SeedUser(
            String email,
            String password,
            User.Role role,
            String firstName,
            String lastName,
            String employeeCode,
            Department department,
            String designation
    ) {
    }
}
