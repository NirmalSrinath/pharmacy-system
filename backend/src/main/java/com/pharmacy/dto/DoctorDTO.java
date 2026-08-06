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
public class DoctorDTO {

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

    private String registrationNumber;

    private String registrationCouncil;

    private String qualification;

    private String specialization;

    private String passcode;

    private Boolean active;

    private LocalDateTime createdAt;
}
