package com.pharmacy.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseDTO {

    private Long id;

    private Long medicineId;

    private String medicineName;

    private String genericName;

    private String batchNumber;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", message = "Unit price must be positive")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.0", message = "GST rate must be positive")
    private BigDecimal gstRate;

    private BigDecimal gstAmount;

    private BigDecimal total;

    private String supplierName;

    private String invoiceNumber;

    private String rackNumber;

    private String medicineType;

    private LocalDateTime purchaseDate;

    private Long createdBy;

    private LocalDateTime createdAt;

    private Long version;
}
