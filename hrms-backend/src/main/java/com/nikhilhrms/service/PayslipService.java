package com.nikhilhrms.service;

import com.nikhilhrms.dto.PayslipDTO;
import com.nikhilhrms.entity.Payslip;
import com.nikhilhrms.repository.PayslipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PayslipService {

    @Autowired
    private PayslipRepository payslipRepository;

    public List<PayslipDTO> getEmployeePayslips(Long employeeId) {
        return payslipRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<PayslipDTO> getAllPayslips() {
        return payslipRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private PayslipDTO mapToDTO(Payslip payslip) {
        PayslipDTO dto = new PayslipDTO();
        dto.setId(payslip.getId());
        dto.setEmployeeId(payslip.getEmployee().getId());
        dto.setEmployeeName(payslip.getEmployee().getFirstName() + " " + payslip.getEmployee().getLastName());
        dto.setMonth(payslip.getMonth());
        dto.setYear(payslip.getYear());
        dto.setPdfPath(payslip.getPdfPath());
        dto.setIssuedDate(payslip.getIssuedDate().toString());
        return dto;
    }
}
