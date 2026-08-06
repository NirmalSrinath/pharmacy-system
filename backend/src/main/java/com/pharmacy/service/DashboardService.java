package com.pharmacy.service;

import com.pharmacy.dto.DashboardDTO;
import com.pharmacy.dto.MonthlyData;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        BigDecimal todaySales = salesRepository.sumTotalByDateRange(todayStart, todayEnd);
        BigDecimal todayPurchases = purchaseRepository.sumTotalByDateRange(todayStart, todayEnd);

        List<SaleDTO> recentSales = salesService.getRecentSales();

        LocalDateTime startOfMonth = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
        BigDecimal monthlySales = salesRepository.sumCurrentMonthSales(startOfMonth);

        long totalSalesCount = salesRepository.count();
        long totalPurchaseCount = purchaseRepository.count();

        if (totalSales == null) totalSales = BigDecimal.ZERO;
        if (totalPurchases == null) totalPurchases = BigDecimal.ZERO;
        if (todaySales == null) todaySales = BigDecimal.ZERO;
        if (todayPurchases == null) todayPurchases = BigDecimal.ZERO;
        if (monthlySales == null) monthlySales = BigDecimal.ZERO;

        List<MonthlyData> monthlySalesData = buildMonthlyChartData();

        return DashboardDTO.builder()
                .totalSales(totalSales)
                .totalPurchases(totalPurchases)
                .todaySales(todaySales)
                .todayPurchases(todayPurchases)
                .totalMedicines(totalMedicines)
                .lowStockCount(lowStockCount)
                .expiryAlertCount(expiryAlertCount)
                .recentSales(recentSales)
                .monthlySales(monthlySales)
                .totalSalesCount(totalSalesCount)
                .totalPurchaseCount(totalPurchaseCount)
                .monthlySalesData(monthlySalesData)
                .build();
    }

    private List<MonthlyData> buildMonthlyChartData() {
        LocalDateTime startOfYear = LocalDate.now().withDayOfYear(1).atStartOfDay();

        List<Object[]> salesRows = salesRepository.findMonthlySalesAggregation(startOfYear);
        List<Object[]> purchaseRows = purchaseRepository.findMonthlyPurchasesAggregation(startOfYear);

        Map<String, BigDecimal> salesMap = new LinkedHashMap<>();
        for (Object[] row : salesRows) {
            String month = (String) row[0];
            BigDecimal total = row[1] instanceof BigDecimal ? (BigDecimal) row[1] : new BigDecimal(row[1].toString());
            salesMap.put(month, total);
        }

        Map<String, BigDecimal> purchaseMap = new LinkedHashMap<>();
        for (Object[] row : purchaseRows) {
            String month = (String) row[0];
            BigDecimal total = row[1] instanceof BigDecimal ? (BigDecimal) row[1] : new BigDecimal(row[1].toString());
            purchaseMap.put(month, total);
        }

        String[] allMonths = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        int currentMonthIndex = LocalDate.now().getMonthValue();

        List<MonthlyData> result = new ArrayList<>();
        for (int i = 0; i < currentMonthIndex; i++) {
            String month = allMonths[i];
            result.add(MonthlyData.builder()
                    .month(month)
                    .sales(salesMap.getOrDefault(month, BigDecimal.ZERO))
                    .purchases(purchaseMap.getOrDefault(month, BigDecimal.ZERO))
                    .build());
        }

        return result;
    }
}
