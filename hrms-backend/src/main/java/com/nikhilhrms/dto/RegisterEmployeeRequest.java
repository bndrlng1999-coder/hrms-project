package com.nikhilhrms.dto;

import com.nikhilhrms.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterEmployeeRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String employeeCode;
    private Long departmentId;
    private String designation;
    private String phoneNumber;
}
