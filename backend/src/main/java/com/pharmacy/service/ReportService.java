package com.pharmacy.service;

import com.pharmacy.dto.ReportDTO;
import com.pharmacy.dto.TopMedicineDTO;
import com.pharmacy.entity.SalesItem;
import com.pharmacy.repository.MedicineRepository;
import com.pharmacy.repository.PurchaseRepository;
import com.pharmacy.repository.SalesItemRepository;
import com.pharmacy.repository.SalesRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final SalesRepository salesRepository;
    private final PurchaseRepository purchaseRepository;
    private final SalesItemRepository salesItemRepository;
    private final MedicineRepository medicineRepository;

    public ReportService(SalesRepository salesRepository,
                         PurchaseRepository purchaseRepository,
                         SalesItemRepository salesItemRepository,
                         MedicineRepository medicineRepository) {
        this.salesRepository = salesRepository;
        this.purchaseRepository = purchaseRepository;
        this.salesItemRepository = salesItemRepository;
        this.medicineRepository = medicineRepository;
    }

    public ReportDTO getDailyReport(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        return buildReport("DAILY", date, date, start, end);
    }

    public ReportDTO getWeeklyReport(LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        return buildReport("WEEKLY", startDate, endDate, start, end);
    }

    public ReportDTO getMonthlyReport(LocalDate date) {
        LocalDate startDate = date.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate endDate = date.with(TemporalAdjusters.lastDayOfMonth());
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        return buildReport("MONTHLY", startDate, endDate, start, end);
    }

    public ReportDTO getYearlyReport(LocalDate date) {
        LocalDate startDate = date.withDayOfYear(1);
        LocalDate endDate = date.withDayOfYear(date.lengthOfYear());
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        return buildReport("YEARLY", startDate, endDate, start, end);
    }

    private ReportDTO buildReport(String reportType, LocalDate startDate, LocalDate endDate,
                                  LocalDateTime start, LocalDateTime end) {
        BigDecimal totalSales = salesRepository.sumTotalByDateRange(start, end);
        BigDecimal totalPurchases = purchaseRepository.sumTotalByDateRange(start, end);
        BigDecimal totalGst = salesRepository.sumGstByDateRange(start, end);
        BigDecimal totalDiscount = salesRepository.sumDiscountByDateRange(start, end);

        if (totalSales == null) totalSales = BigDecimal.ZERO;
        if (totalPurchases == null) totalPurchases = BigDecimal.ZERO;
        if (totalGst == null) totalGst = BigDecimal.ZERO;
        if (totalDiscount == null) totalDiscount = BigDecimal.ZERO;

        BigDecimal netProfit = totalSales.subtract(totalPurchases);

        long totalTransactions = salesRepository.countBySaleDateBetween(start, end);

        Map<String, BigDecimal> dailySales = new LinkedHashMap<>();
        List<Object[]> dailyData = salesRepository.findDailySalesAggregation(start, end);
        for (Object[] row : dailyData) {
            String dateStr = row[0].toString();
            BigDecimal amount = (BigDecimal) row[1];
            dailySales.put(dateStr, amount);
        }

        List<TopMedicineDTO> topSellingMedicines = getTopSellingMedicines(start, end);

        return ReportDTO.builder()
                .reportType(reportType)
                .startDate(startDate)
                .endDate(endDate)
                .totalSales(totalSales)
                .totalPurchases(totalPurchases)
                .netProfit(netProfit)
                .totalGstCollected(totalGst)
                .totalDiscount(totalDiscount)
                .totalTransactions(totalTransactions)
                .dailySales(dailySales)
                .topSellingMedicines(topSellingMedicines)
                .build();
    }

    private List<TopMedicineDTO> getTopSellingMedicines(LocalDateTime start, LocalDateTime end) {
        List<SalesItem> allItems = salesItemRepository.findAll();

        Map<Long, TopMedicineDTO> medicineStats = new HashMap<>();

        for (SalesItem item : allItems) {
            Long medicineId = item.getMedicine().getId();
            medicineStats.computeIfAbsent(medicineId, id ->
                    TopMedicineDTO.builder()
                            .medicineId(id)
                            .medicineName(item.getMedicine().getName())
                            .quantitySold(0)
                            .totalRevenue(BigDecimal.ZERO)
                            .build()
            );

            TopMedicineDTO stat = medicineStats.get(medicineId);
            stat.setQuantitySold(stat.getQuantitySold() + item.getQuantity());
            stat.setTotalRevenue(stat.getTotalRevenue().add(item.getTotal()));
        }

        return medicineStats.values().stream()
                .sorted((a, b) -> b.getQuantitySold().compareTo(a.getQuantitySold()))
                .limit(10)
                .collect(Collectors.toList());
    }
}
