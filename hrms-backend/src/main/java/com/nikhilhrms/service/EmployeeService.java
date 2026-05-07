package com.nikhilhrms.service;

import com.nikhilhrms.dto.EmployeeDTO;
import com.nikhilhrms.entity.Department;
import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.repository.DepartmentRepository;
import com.nikhilhrms.repository.EmployeeRepository;
import com.nikhilhrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return mapToDTO(employee);
    }

    public EmployeeDTO getEmployeeByUserId(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return mapToDTO(employee);
    }

    public List<EmployeeDTO> getEmployeesByDepartment(Long departmentId) {
        return employeeRepository.findByDepartmentId(departmentId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO updateEmployee(Long id, EmployeeDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setDesignation(dto.getDesignation());
        employee.setJoiningDate(dto.getJoiningDate());
        employee.setDateOfBirth(dto.getDateOfBirth());
        employee.setPhoneNumber(dto.getPhoneNumber());
        employee.setAddress(dto.getAddress());
        employee.setCity(dto.getCity());
        employee.setState(dto.getState());
        employee.setCountry(dto.getCountry());
        employee.setPincode(dto.getPincode());
        employee.setPan(dto.getPan());
        employee.setAadhar(dto.getAadhar());
        employee.setBasicSalary(dto.getBasicSalary());

        if (dto.getDepartmentId() != null) {
            Department department = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            employee.setDepartment(department);
        }

        employee = employeeRepository.save(employee);
        return mapToDTO(employee);
    }

    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        if (employee.getUser().getRole() == com.nikhilhrms.entity.User.Role.SUPER_ADMIN) {
            throw new RuntimeException("SUPER_ADMIN cannot be removed");
        }
        employee.setIsActive(false);
        employee.getUser().setIsActive(false);
        employee.getUser().setAccountStatus(com.nikhilhrms.entity.User.AccountStatus.DISABLED);
        userRepository.save(employee.getUser());
        employeeRepository.save(employee);
    }

    private EmployeeDTO mapToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getUser().getEmail());
        dto.setEmployeeCode(employee.getEmployeeCode());
        dto.setDesignation(employee.getDesignation());
        dto.setJoiningDate(employee.getJoiningDate());
        dto.setDateOfBirth(employee.getDateOfBirth());
        dto.setPhoneNumber(employee.getPhoneNumber());
        dto.setAddress(employee.getAddress());
        dto.setCity(employee.getCity());
        dto.setState(employee.getState());
        dto.setCountry(employee.getCountry());
        dto.setPincode(employee.getPincode());
        dto.setPan(employee.getPan());
        dto.setAadhar(employee.getAadhar());
        dto.setBasicSalary(employee.getBasicSalary());
        dto.setManagerId(employee.getManagerId());
        dto.setIsActive(employee.getIsActive());
        
        if (employee.getDepartment() != null) {
            dto.setDepartmentId(employee.getDepartment().getId());
            dto.setDepartmentName(employee.getDepartment().getName());
        }
        
        return dto;
    }
}
