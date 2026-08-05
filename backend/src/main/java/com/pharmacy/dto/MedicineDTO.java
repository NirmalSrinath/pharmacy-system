package com.pharmacy.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineDTO {

    private Long id;

    @NotBlank(message = "Medicine name is required")
    @Size(max = 200)
    private String name;

    @Size(max = 200)
    private String genericName;

    @Size(max = 200)
    private String manufacturer;

    @Size(max = 100)
    private String batchNumber;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    @NotNull(message = "Sale price is required")
    @DecimalMin(value = "0.0", message = "Sale price must be positive")
    private BigDecimal salePrice;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.0", message = "Purchase price must be positive")
    private BigDecimal purchasePrice;

    @DecimalMin(value = "0.0", message = "GST rate must be positive")
    @DecimalMax(value = "100.0", message = "GST rate cannot exceed 100")
    private BigDecimal gstRate;

    @Size(max = 20)
    private String hsnCode;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    private Integer lowStockThreshold;

    @Size(max = 50)
    private String rackNumber;

    @Size(max = 50)
    private String type;

    private Boolean active;

    private Long version;
}
