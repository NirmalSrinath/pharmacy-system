package com.pharmacy.repository;

import com.pharmacy.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesRepository extends JpaRepository<Sale, Long> {

    List<Sale> findBySaleDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<Sale> findByCreatedBy_Id(Long userId);

    Optional<Sale> findByInvoiceNumber(String invoiceNumber);

    @Query("SELECT COALESCE(SUM(s.total), 0) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    BigDecimal sumTotalByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT s FROM Sale s WHERE s.saleDate BETWEEN :start AND :end ORDER BY s.saleDate DESC")
    List<Sale> findSalesByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(s.gstAmount), 0) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    BigDecimal sumGstByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(s.discount), 0) FROM Sale s WHERE s.saleDate BETWEEN :start AND :end")
    BigDecimal sumDiscountByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DATE', s.saleDate) as date, COALESCE(SUM(s.total), 0) as dailyTotal " +
           "FROM Sale s WHERE s.saleDate BETWEEN :start AND :end " +
           "GROUP BY FUNCTION('DATE', s.saleDate) ORDER BY date")
    List<Object[]> findDailySalesAggregation(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    long countBySaleDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(s.total), 0) FROM Sale s")
    BigDecimal sumAllSales();

    List<Sale> findTop10ByOrderBySaleDateDesc();

    @Query("SELECT COALESCE(SUM(s.total), 0) FROM Sale s WHERE s.saleDate >= :startOfMonth")
    BigDecimal sumCurrentMonthSales(@Param("startOfMonth") LocalDateTime startOfMonth);
}
