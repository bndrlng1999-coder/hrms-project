package com.nikhilhrms.config;

import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.InternalMailbox;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.InternalMailMessageRepository;
import com.nikhilhrms.service.InternalMailService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

//@Configuration
public class InternalMailSeedData {

    @Bean
    CommandLineRunner seedInternalMail(
            EmployeeRepository employeeRepository,
            InternalMailMessageRepository messageRepository,
            InternalMailService internalMailService
    ) {
        return args -> {
            List<Employee> employees = employeeRepository.findAll();
            if (employees.isEmpty()) {
                return;
            }
            employees.stream().filter(employee -> Boolean.TRUE.equals(employee.getIsActive())).forEach(internalMailService::ensureMailbox);

            if (messageRepository.count() > 0 || employees.size() < 5) {
                return;
            }

            InternalMailbox admin = internalMailService.ensureMailbox(employees.get(0));
            InternalMailbox hr = internalMailService.ensureMailbox(employees.get(1));
            InternalMailbox manager = internalMailService.ensureMailbox(employees.get(2));
            InternalMailbox managerTwo = internalMailService.ensureMailbox(employees.get(3));
            InternalMailbox employee = internalMailService.ensureMailbox(employees.get(4));

            internalMailService.seedMessage(admin, Map.of(
                    "to", List.of(hr.getId(), manager.getId(), employee.getId()),
                    "subject", "Welcome to Tanvox Internal Mail",
                    "body", "This mailbox is only for communication inside the Tanvox HRMS portal."
            ));

            internalMailService.seedMessage(manager, Map.of(
                    "to", List.of(employee.getId()),
                    "cc", List.of(hr.getId()),
                    "subject", "Project Tracker rollout notes",
                    "body", "Please review the new Project Tracker module and share any workflow gaps."
            ));

            internalMailService.seedMessage(admin, Map.of(
                    "to", List.of(managerTwo.getId()),
                    "subject", "Website sprint handoff",
                    "body", "Sharing the internal sprint update for the website refresh team."
            ));
        };
    }
}
