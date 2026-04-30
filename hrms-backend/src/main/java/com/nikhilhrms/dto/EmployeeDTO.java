package com.nikhilhrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String employeeCode;
    private Long departmentId;
    private String departmentName;
    private String designation;
    private LocalDate joiningDate;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String address;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private String pan;
    private String aadhar;
    private BigDecimal basicSalary;
    private Long managerId;
    private Boolean isActive;
}
