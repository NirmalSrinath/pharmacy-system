package com.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDTO {

    private Long id;

    private String fullName;

    private String gender;

    private LocalDate dateOfBirth;

    private String phone;

    private String email;

    private String address;

    private String state;

    private String pincode;

    private String aadhaarNumber;

    private String panNumber;

    private String employeeId;

    private String designation;

    private String department;

    private String qualification;

    private LocalDate dateOfJoining;

    private String passcode;

    private Boolean active;

    private LocalDateTime createdAt;
}
