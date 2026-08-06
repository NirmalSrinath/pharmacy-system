package com.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierDTO {

    private Long id;

    private String companyName;

    private String contactPerson;

    private String phone;

    private String email;

    private String gstin;

    private String drugLicenseNumber;

    private String address;

    private String state;

    private String pincode;

    private String panNumber;

    private String bankName;

    private String bankAccountNumber;

    private String bankIfsc;

    private Boolean active;

    private LocalDateTime createdAt;
}
