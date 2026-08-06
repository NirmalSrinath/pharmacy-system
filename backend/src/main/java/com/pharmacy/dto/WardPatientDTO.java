package com.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WardPatientDTO {
    private Long id;
    private String patientName;
    private String patientPhone;
    private String doctorName;
    private String wardNumber;
    private String bedNumber;
    private LocalDate admitDate;
    private LocalDate dischargeDate;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal gstAmount;
    private BigDecimal discount;
    private BigDecimal grandTotal;
    private String paymentMethod;
    private Long saleId;
    private String createdBy;
    private List<WardPatientItemDTO> items;
    private String createdAt;
}
