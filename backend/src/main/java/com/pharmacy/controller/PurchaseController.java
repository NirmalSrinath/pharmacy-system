package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.PurchaseDTO;
import com.pharmacy.service.PurchaseService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseDTO>> createPurchase(@Valid @RequestBody PurchaseDTO purchaseDTO,
                                                                    Authentication authentication) {
        PurchaseDTO created = purchaseService.createPurchase(purchaseDTO, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Purchase recorded successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseDTO>>> getAllPurchases() {
        List<PurchaseDTO> purchases = purchaseService.getAllPurchases();
        return ResponseEntity.ok(ApiResponse.success(purchases));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseDTO>> getPurchaseById(@PathVariable Long id) {
        PurchaseDTO purchase = purchaseService.getPurchaseById(id);
        return ResponseEntity.ok(ApiResponse.success(purchase));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<PurchaseDTO>>> getPurchasesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PurchaseDTO> purchases = purchaseService.getPurchasesByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(purchases));
    }

    @GetMapping("/export")
    public void exportPurchases(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) throws IOException {

        List<PurchaseDTO> purchases = purchaseService.getPurchasesByDateRange(startDate, endDate);

        response.setContentType("text/csv");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=purchases_report.csv");

        StringBuilder csv = new StringBuilder();
        csv.append("Medicine,Quantity,Unit Price,GST Rate,GST Amount,Total,Supplier,Invoice Number,Purchase Date\n");

        for (PurchaseDTO purchase : purchases) {
            csv.append(String.format("%s,%d,%s,%s,%s,%s,%s,%s,%s\n",
                    purchase.getMedicineName(),
                    purchase.getQuantity(),
                    purchase.getUnitPrice(),
                    purchase.getGstRate(),
                    purchase.getGstAmount(),
                    purchase.getTotal(),
                    purchase.getSupplierName() != null ? purchase.getSupplierName() : "",
                    purchase.getInvoiceNumber() != null ? purchase.getInvoiceNumber() : "",
                    purchase.getPurchaseDate() != null ? purchase.getPurchaseDate().toString() : ""
            ));
        }

        response.getOutputStream().write(csv.toString().getBytes());
    }
}
