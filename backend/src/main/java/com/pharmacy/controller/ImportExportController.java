package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.MedicineDTO;
import com.pharmacy.service.ImportExportService;
import com.pharmacy.service.MedicineService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ImportExportController {

    private final ImportExportService importExportService;
    private final MedicineService medicineService;

    public ImportExportController(ImportExportService importExportService, MedicineService medicineService) {
        this.importExportService = importExportService;
        this.medicineService = medicineService;
    }

    @PostMapping("/import/medicines")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> importMedicines(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Please upload a CSV file"));
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("text/csv") && !contentType.equals("application/vnd.ms-excel"))) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only CSV files are supported"));
        }

        try {
            List<MedicineDTO> imported = importExportService.importMedicinesFromCSV(file.getInputStream());
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Successfully imported %d medicines", imported.size()), imported));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error importing file: " + e.getMessage()));
        }
    }

    @GetMapping("/export/medicines")
    public void exportMedicines(@RequestParam(defaultValue = "csv") String format,
                                 HttpServletResponse response) throws IOException {
        List<MedicineDTO> medicines = medicineService.getAllMedicines();

        if ("csv".equalsIgnoreCase(format)) {
            byte[] csvData = importExportService.exportMedicinesToCSV(medicines);
            response.setContentType("text/csv");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=medicines_export.csv");
            response.getOutputStream().write(csvData);
        } else {
            response.setContentType("application/json");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=medicines_export.json");
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < medicines.size(); i++) {
                MedicineDTO m = medicines.get(i);
                json.append(String.format(
                        "{\"id\":%d,\"name\":\"%s\",\"genericName\":\"%s\",\"manufacturer\":\"%s\"," +
                        "\"batchNumber\":\"%s\",\"stockQuantity\":%d,\"salePrice\":\"%s\"," +
                        "\"purchasePrice\":\"%s\",\"gstRate\":\"%s\",\"hsnCode\":\"%s\"," +
                        "\"expiryDate\":\"%s\",\"lowStockThreshold\":%d}",
                        m.getId(),
                        escapeJson(m.getName()),
                        escapeJson(m.getGenericName()),
                        escapeJson(m.getManufacturer()),
                        escapeJson(m.getBatchNumber()),
                        m.getStockQuantity() != null ? m.getStockQuantity() : 0,
                        m.getSalePrice(),
                        m.getPurchasePrice(),
                        m.getGstRate(),
                        escapeJson(m.getHsnCode()),
                        m.getExpiryDate() != null ? m.getExpiryDate().toString() : "",
                        m.getLowStockThreshold() != null ? m.getLowStockThreshold() : 10
                ));
                if (i < medicines.size() - 1) {
                    json.append(",");
                }
            }
            json.append("]");
            response.getOutputStream().write(json.toString().getBytes());
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
