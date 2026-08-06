package com.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WardPatientItemDTO {
    private Long id;
    private Long wardPatientId;
    private Long medicineId;
    private String medicineName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal gstRate;
    private BigDecimal gstAmount;
    private BigDecimal total;
    private String status;
    private String addedAt;
}
