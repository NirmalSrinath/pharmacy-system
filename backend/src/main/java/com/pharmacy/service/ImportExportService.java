package com.pharmacy.service;

import com.pharmacy.dto.MedicineDTO;
import com.pharmacy.exception.BadRequestException;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImportExportService {

    private final MedicineService medicineService;

    public ImportExportService(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    public List<MedicineDTO> importMedicinesFromCSV(InputStream inputStream) {
        List<MedicineDTO> importedMedicines = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord record : parser) {
                try {
                    MedicineDTO dto = MedicineDTO.builder()
                            .name(record.get("name"))
                            .genericName(getOptionalField(record, "generic_name"))
                            .manufacturer(getOptionalField(record, "manufacturer"))
                            .batchNumber(getOptionalField(record, "batch_number"))
                            .stockQuantity(parseIntField(record, "stock_quantity"))
                            .salePrice(parseBigDecimalField(record, "sale_price"))
                            .purchasePrice(parseBigDecimalField(record, "purchase_price"))
                            .gstRate(parseBigDecimalFieldOrDefault(record, "gst_rate", new BigDecimal("12.00")))
                            .hsnCode(getOptionalField(record, "hsn_code"))
                            .expiryDate(parseDateField(record, "expiry_date"))
                            .lowStockThreshold(parseIntFieldOrDefault(record, "low_stock_threshold", 10))
                            .build();

                    MedicineDTO saved = medicineService.createMedicine(dto);
                    importedMedicines.add(saved);
                } catch (Exception e) {
                    throw new BadRequestException("Error importing row " + record.getRecordNumber() + ": " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new BadRequestException("Error reading CSV file: " + e.getMessage());
        }

        return importedMedicines;
    }

    public byte[] exportMedicinesToCSV(List<MedicineDTO> medicines) {
        StringWriter writer = new StringWriter();

        try (CSVPrinter printer = new CSVPrinter(writer,
                CSVFormat.DEFAULT.builder()
                        .setHeader("id", "name", "generic_name", "manufacturer", "batch_number",
                                "stock_quantity", "sale_price", "purchase_price", "gst_rate", "hsn_code",
                                "expiry_date", "low_stock_threshold")
                        .build())) {

            for (MedicineDTO medicine : medicines) {
                printer.printRecord(
                        medicine.getId(),
                        medicine.getName(),
                        medicine.getGenericName(),
                        medicine.getManufacturer(),
                        medicine.getBatchNumber(),
                        medicine.getStockQuantity(),
                        medicine.getSalePrice(),
                        medicine.getPurchasePrice(),
                        medicine.getGstRate(),
                        medicine.getHsnCode(),
                        medicine.getExpiryDate() != null ? medicine.getExpiryDate().toString() : "",
                        medicine.getLowStockThreshold()
                );
            }
        } catch (IOException e) {
            throw new BadRequestException("Error exporting CSV: " + e.getMessage());
        }

        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String getOptionalField(CSVRecord record, String fieldName) {
        try {
            String value = record.get(fieldName);
            return (value != null && !value.trim().isEmpty()) ? value.trim() : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private int parseIntField(CSVRecord record, String fieldName) {
        String value = record.get(fieldName);
        if (value == null || value.trim().isEmpty()) {
            return 0;
        }
        return Integer.parseInt(value.trim());
    }

    private int parseIntFieldOrDefault(CSVRecord record, String fieldName, int defaultValue) {
        try {
            String value = record.get(fieldName);
            if (value == null || value.trim().isEmpty()) {
                return defaultValue;
            }
            return Integer.parseInt(value.trim());
        } catch (IllegalArgumentException e) {
            return defaultValue;
        }
    }

    private BigDecimal parseBigDecimalField(CSVRecord record, String fieldName) {
        String value = record.get(fieldName);
        if (value == null || value.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.trim());
    }

    private BigDecimal parseBigDecimalFieldOrDefault(CSVRecord record, String fieldName, BigDecimal defaultValue) {
        try {
            String value = record.get(fieldName);
            if (value == null || value.trim().isEmpty()) {
                return defaultValue;
            }
            return new BigDecimal(value.trim());
        } catch (IllegalArgumentException e) {
            return defaultValue;
        }
    }

    private LocalDate parseDateField(CSVRecord record, String fieldName) {
        String value = record.get(fieldName);
        if (value == null || value.trim().isEmpty()) {
            return LocalDate.now().plusYears(1);
        }
        try {
            return LocalDate.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            try {
                return LocalDate.parse(value.trim(), DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } catch (DateTimeParseException ex) {
                return LocalDate.parse(value.trim(), DateTimeFormatter.ofPattern("MM/dd/yyyy"));
            }
        }
    }
}
