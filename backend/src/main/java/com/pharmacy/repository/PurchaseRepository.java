package com.pharmacy.repository;

import com.pharmacy.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    List<Purchase> findByPurchaseDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Purchase p WHERE p.purchaseDate BETWEEN :start AND :end")
    BigDecimal sumTotalByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Purchase p")
    BigDecimal sumAllPurchases();

    long countByPurchaseDateBetween(LocalDateTime startDate, LocalDateTime endDate);
}
