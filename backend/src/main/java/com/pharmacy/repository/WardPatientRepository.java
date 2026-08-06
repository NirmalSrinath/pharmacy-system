package com.pharmacy.repository;

import com.pharmacy.entity.WardPatient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WardPatientRepository extends JpaRepository<WardPatient, Long> {

    List<WardPatient> findByStatusOrderByCreatedAtDesc(String status);

    List<WardPatient> findAllByOrderByCreatedAtDesc();

    List<WardPatient> findByAdmitDateBetweenOrderByCreatedAtDesc(LocalDate startDate, LocalDate endDate);

    List<WardPatient> findByStatusAndAdmitDateBetweenOrderByCreatedAtDesc(String status, LocalDate startDate, LocalDate endDate);

    @Query("SELECT wp FROM WardPatient wp WHERE wp.patientName LIKE %:keyword% OR wp.patientPhone LIKE %:keyword% OR wp.doctorName LIKE %:keyword% ORDER BY wp.createdAt DESC")
    List<WardPatient> searchByKeyword(@Param("keyword") String keyword);
}
