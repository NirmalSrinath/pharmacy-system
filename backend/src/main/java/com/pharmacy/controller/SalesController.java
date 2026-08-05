package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.MedicineDTO;
import com.pharmacy.dto.SaleDTO;
import com.pharmacy.service.ImportExportService;
import com.pharmacy.service.MedicineService;
import com.pharmacy.service.SalesService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private final SalesService salesService;
    private final MedicineService medicineService;
    private final ImportExportService importExportService;

    public SalesController(SalesService salesService,
                           MedicineService medicineService,
                           ImportExportService importExportService) {
        this.salesService = salesService;
        this.medicineService = medicineService;
        this.importExportService = importExportService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SaleDTO>> createSale(@Valid @RequestBody SaleDTO saleDTO,
                                                            Authentication authentication) {
        SaleDTO created = salesService.createSale(saleDTO, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Sale created successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SaleDTO>>> getAllSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<SaleDTO> sales;
        if (startDate != null && endDate != null) {
            sales = salesService.getSalesByDateRange(startDate, endDate);
        } else {
            sales = salesService.getAllSales();
        }
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleDTO>> getSaleById(@PathVariable Long id) {
        SaleDTO sale = salesService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.success(sale));
    }

    @GetMapping("/export")
    public void exportSales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) throws IOException {

        List<SaleDTO> sales = salesService.getSalesByDateRange(startDate, endDate);

        if ("csv".equalsIgnoreCase(format)) {
            response.setContentType("text/csv");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales_report.csv");

            StringBuilder csv = new StringBuilder();
            csv.append("Invoice Number,Customer Name,Customer Phone,Subtotal,GST Amount,Discount,Total,Payment Method,Sale Date\n");

            for (SaleDTO sale : sales) {
                csv.append(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                        sale.getInvoiceNumber(),
                        sale.getCustomerName() != null ? sale.getCustomerName() : "",
                        sale.getCustomerPhone() != null ? sale.getCustomerPhone() : "",
                        sale.getSubtotal(),
                        sale.getGstAmount(),
                        sale.getDiscount(),
                        sale.getTotal(),
                        sale.getPaymentMethod(),
                        sale.getSaleDate() != null ? sale.getSaleDate().toString() : ""
                ));
            }

            response.getOutputStream().write(csv.toString().getBytes());
        } else {
            response.setContentType("application/json");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales_report.json");
            response.getOutputStream().write(sales.toString().getBytes());
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<SaleDTO>>> getSalesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<SaleDTO> sales = salesService.getSalesByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<SaleDTO>>> getRecentSales() {
        List<SaleDTO> sales = salesService.getRecentSales();
        return ResponseEntity.ok(ApiResponse.success(sales));
    }
}
