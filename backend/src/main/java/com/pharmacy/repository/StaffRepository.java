package com.pharmacy.repository;

import com.pharmacy.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByActiveTrue();
    List<Staff> findByFullNameContainingIgnoreCase(String fullName);
}
