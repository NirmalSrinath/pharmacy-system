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
public class TopMedicineDTO {
    private Long medicineId;
    private String medicineName;
    private Integer quantitySold;
    private BigDecimal totalRevenue;
}
