package com.nikhilhrms.repository;

import com.nikhilhrms.entity.Employee;
import com.nikhilhrms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByUserId(Long userId);
    Optional<Employee> findByUserEmail(String email);
    Optional<Employee> findByEmployeeCode(String employeeCode);
    List<Employee> findByDepartmentId(Long departmentId);
    List<Employee> findByIsActiveTrue();
    List<Employee> findByUserRoleIn(List<User.Role> roles);
}
