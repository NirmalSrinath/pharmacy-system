package com.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {
    private BigDecimal totalSales;
    private BigDecimal totalPurchases;
    private Long totalMedicines;
    private Long lowStockCount;
    private Long expiryAlertCount;
    private List<SaleDTO> recentSales;
    private BigDecimal monthlySales;
    private Long totalSalesCount;
    private Long totalPurchaseCount;
}
