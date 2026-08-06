package com.pharmacy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleDTO {

    private Long id;

    private String customerName;

    private String customerPhone;

    private String doctorName;

    private String staffName;

    private String invoiceNumber;

    @NotNull(message = "Sale items are required")
    @Valid
    private List<SaleItemDTO> saleItems;

    private BigDecimal subtotal;

    private BigDecimal gstAmount;

    private BigDecimal discount;

    private BigDecimal total;

    private String paymentMethod;

    private Long createdBy;

    private String createdByName;

    private LocalDateTime saleDate;

    private LocalDateTime createdAt;
}
