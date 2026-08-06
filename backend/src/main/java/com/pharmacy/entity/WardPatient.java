package com.pharmacy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ward_patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WardPatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_name", nullable = false, length = 200)
    private String patientName;

    @Column(name = "patient_phone", length = 15)
    private String patientPhone;

    @Column(name = "doctor_name", length = 200)
    private String doctorName;

    @Column(name = "ward_number", length = 50)
    private String wardNumber;

    @Column(name = "bed_number", length = 50)
    private String bedNumber;

    @Column(name = "admit_date", nullable = false)
    private LocalDate admitDate;

    @Column(name = "discharge_date")
    private LocalDate dischargeDate;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ADMITTED";

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "gst_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal gstAmount = BigDecimal.ZERO;

    @Column(name = "discount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "payment_method")
    @Builder.Default
    private String paymentMethod = "CASH";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id")
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "wardPatient", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WardPatientItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
