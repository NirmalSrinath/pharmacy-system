package com.pharmacy.repository;

import com.pharmacy.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    List<Medicine> findByExpiryDateBefore(LocalDate date);

    List<Medicine> findByStockQuantityLessThan(Integer threshold);

    List<Medicine> findByExpiryDateBetween(LocalDate startDate, LocalDate endDate);

    List<Medicine> findByNameContainingIgnoreCase(String name);

    @Query("SELECT m FROM Medicine m WHERE m.expiryDate <= :date")
    List<Medicine> findExpiryAlerts(@Param("date") LocalDate date);

    @Query("SELECT m FROM Medicine m WHERE m.stockQuantity <= m.lowStockThreshold")
    List<Medicine> findLowStockMedicines();

    List<Medicine> findByStockQuantityLessThanEqual(Integer threshold);

    @Query("SELECT m FROM Medicine m WHERE LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(m.genericName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(m.manufacturer) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Medicine> searchMedicines(@Param("keyword") String keyword);
}
