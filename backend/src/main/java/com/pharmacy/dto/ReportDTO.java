package com.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDTO {
    private String reportType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalSales;
    private BigDecimal totalPurchases;
    private BigDecimal netProfit;
    private BigDecimal totalGstCollected;
    private BigDecimal totalDiscount;
    private Long totalTransactions;
    private Map<String, BigDecimal> dailySales;
    private List<TopMedicineDTO> topSellingMedicines;
}
