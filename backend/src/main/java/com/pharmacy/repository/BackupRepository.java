package com.pharmacy.repository;

import com.pharmacy.entity.Backup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BackupRepository extends JpaRepository<Backup, Long> {
    List<Backup> findAllByOrderByCreatedAtDesc();
    List<Backup> findByStatusOrderByCreatedAtDesc(String status);
    long countByStatus(String status);
}
