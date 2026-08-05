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
public class ReturnDTO {

    private Long id;

    @NotNull(message = "Medicine ID is required")
    private Long medicineId;

    private String medicineName;

    private Long saleId;

    private String saleInvoiceNumber;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String reason;

    private BigDecimal refundAmount;

    private LocalDateTime returnDate;

    private Long createdBy;

    private LocalDateTime createdAt;
}
