package com.pharmacy.repository;

import com.pharmacy.entity.Return;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnsRepository extends JpaRepository<Return, Long> {
    List<Return> findBySaleId(Long saleId);
    List<Return> findByMedicineId(Long medicineId);
}
