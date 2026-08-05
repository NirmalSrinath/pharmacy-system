package com.pharmacy.service;

import com.pharmacy.dto.DashboardDTO;
import com.pharmacy.dto.SaleDTO;
import com.pharmacy.entity.Sale;
import com.pharmacy.repository.MedicineRepository;
import com.pharmacy.repository.PurchaseRepository;
import com.pharmacy.repository.SalesRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final SalesRepository salesRepository;
    private final PurchaseRepository purchaseRepository;
    private final MedicineRepository medicineRepository;
    private final SalesService salesService;

    public DashboardService(SalesRepository salesRepository,
                            PurchaseRepository purchaseRepository,
                            MedicineRepository medicineRepository,
                            SalesService salesService) {
        this.salesRepository = salesRepository;
        this.purchaseRepository = purchaseRepository;
        this.medicineRepository = medicineRepository;
        this.salesService = salesService;
    }

    public DashboardDTO getDashboardData() {
        BigDecimal totalSales = salesRepository.sumAllSales();
        BigDecimal totalPurchases = purchaseRepository.sumAllPurchases();
        long totalMedicines = medicineRepository.count();
        long lowStockCount = medicineRepository.findLowStockMedicines().size();
        long expiryAlertCount = medicineRepository.findExpiryAlerts(LocalDate.now()).size();

        List<SaleDTO> recentSales = salesService.getRecentSales();

        LocalDateTime startOfMonth = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
        BigDecimal monthlySales = salesRepository.sumCurrentMonthSales(startOfMonth);

        long totalSalesCount = salesRepository.count();
        long totalPurchaseCount = purchaseRepository.count();

        if (totalSales == null) totalSales = BigDecimal.ZERO;
        if (totalPurchases == null) totalPurchases = BigDecimal.ZERO;
        if (monthlySales == null) monthlySales = BigDecimal.ZERO;

        return DashboardDTO.builder()
                .totalSales(totalSales)
                .totalPurchases(totalPurchases)
                .totalMedicines(totalMedicines)
                .lowStockCount(lowStockCount)
                .expiryAlertCount(expiryAlertCount)
                .recentSales(recentSales)
                .monthlySales(monthlySales)
                .totalSalesCount(totalSalesCount)
                .totalPurchaseCount(totalPurchaseCount)
                .build();
    }
}
